import { Request, Response } from "express";
import { sendOTPEmail } from "../utils/email";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Function to generate a random string
const generateRandomString = (length: number) => {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Function to extract name and subdomain from email
const extractFromEmail = (email: string) => {
  // Extract the local part before @
  const localPart = email.split("@")[0];

  // Remove common separators and convert to proper case
  const cleanName = localPart
    .replace(/[._-]/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  // Create subdomain by removing spaces and converting to lowercase
  const baseSubdomain = localPart.replace(/[._]/g, "").toLowerCase();

  return {
    fullName: cleanName,
    subdomain: baseSubdomain,
  };
};

// Function to generate a unique subdomain
const generateUniqueSubdomain = async (
  baseSubdomain: string
): Promise<string> => {
  let subdomain = baseSubdomain;
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    try {
      // Try to find an existing agent with this subdomain
      const existingAgent = await prisma.agent.findUnique({
        where: { subdomain },
      });

      if (!existingAgent) {
        return subdomain;
      }

      // If subdomain exists, append a random string
      subdomain = `${baseSubdomain}-${generateRandomString(4)}`;
      attempts++;
    } catch (error) {
      console.error("Error checking subdomain uniqueness:", error);
      throw error;
    }
  }

  throw new Error(
    "Could not generate a unique subdomain after multiple attempts"
  );
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    // Check if email exists in AgentWebsite table
    const agent = await prisma.agent.findUnique({
      where: { email },
    });

    if (!agent) {
      return res.status(404).json({ error: "Email not found" });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    // Find the most recent OTP for this email
    const existingOTP = await prisma.oTP.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
    });

    if (existingOTP) {
      // Update existing OTP
      await prisma.oTP.update({
        where: { id: existingOTP.id },
        data: {
          code: otp,
          expiresAt,
          used: false,
        },
      });
    } else {
      // Create new OTP
      await prisma.oTP.create({
        data: {
          email,
          code: otp,
          expiresAt,
        },
      });
    }

    // Send OTP via email
    const emailSent = await sendOTPEmail(email, otp);

    if (!emailSent) {
      return res.status(500).json({ error: "Failed to send OTP email" });
    }

    res.status(200).json({
      message: "OTP sent successfully",
      email,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ error: "Email and OTP are required" });
      return;
    }

    // Find the most recent valid OTP for the email
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        email,
        code: otp,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Mark OTP as used
    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    // Get agent details
    const agent = await prisma.agent.findUnique({
      where: { email },
    });

    if (!agent) {
      res.status(404).json({ error: "Agent not found" });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: agent.id,
        email: agent.email,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "OTP verified successfully",
      token,
      agent: {
        id: agent.id,
        email: agent.email,
        fullName: agent.fullName,
        subdomain: agent.subdomain,
        package_name: agent.package_name,
      },
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const autoLogin = async (req: Request, res: Response) => {
  try {
    const { email, ts, token: linkToken, entityid } = req.body;
    console.log(email, ts, linkToken, entityid);
    if (!email || !ts || !linkToken || !entityid) {
      return res
        .status(400)
        .json({ error: "Invalid link - missing parameters" });
    }

    // Get secret from environment variable
    const SECRET =
      process.env.AUTO_LOGIN_SECRET || "a384b6463fc216a5f8ecb6670f86456a";
    const LINK_EXPIRY = 30 * 60 * 1000; // 30 minutes

    // Check expiry
    const linkTimestamp = parseInt(ts as string);
    if (Date.now() - linkTimestamp > LINK_EXPIRY) {
      console.log("Link expired");
      return res.status(400).json({ error: "Link expired" });
    }

    // Hash only includes email and timestamp since we extract other data from email
    const hashData = `${email}${ts}`;

    // Recompute the hash to verify authenticity
    const validHash = crypto
      .createHmac("sha256", SECRET)
      .update(hashData)
      .digest("hex");

    if (String(linkToken) !== validHash) {
      return res.status(403).json({ error: "Invalid token" });
    }

    // Try to find existing agent first
    let agent = await prisma.agent.findUnique({
      where: { email: email as string },
    });

    // If agent exists but doesn't have entityId, update it
    if (agent && !agent.entityId) {
      agent = await prisma.agent.update({
        where: { email: email as string },
        data: { entityId: entityid as string },
      });
    }

    // If agent doesn't exist, create new agent using data extracted from email
    if (!agent) {
      try {
        // Extract fullName and subdomain from email
        const { fullName, subdomain } = extractFromEmail(email as string);

        // Generate a unique subdomain if the extracted one is taken
        const uniqueSubdomain = await generateUniqueSubdomain(subdomain);

        // Create new agent
        agent = await prisma.agent.create({
          data: {
            email: email as string,
            fullName: fullName,
            subdomain: uniqueSubdomain,
            package_name: "DETAILED", // Default package
            entityId: entityid as string,
          },
        });

        console.log(
          `New agent registered via auto login: ${agent.email} with subdomain: ${uniqueSubdomain}`
        );
      } catch (createError: any) {
        // If email already exists, try to find by email instead
        if (createError.code === "P2002") {
          agent = await prisma.agent.findUnique({
            where: { email: email as string },
          });

          if (!agent) {
            return res.status(400).json({
              error: "Failed to create agent - email may already exist",
            });
          }
        } else {
          throw createError;
        }
      }
    }

    // At this point, agent should always exist (either found or created)
    // Generate JWT token for the authenticated user
    const token = jwt.sign(
      {
        id: agent.id,
        email: agent.email,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message:
        agent.createdAt.getTime() > Date.now() - 5000
          ? "Agent registered and logged in successfully"
          : "Auto login successful",
      token,
      agent: {
        id: agent.id,
        email: agent.email,
        fullName: agent.fullName,
        subdomain: agent.subdomain,
        package_name: agent.package_name,
        entityId: agent.entityId,
      },
    });
  } catch (error) {
    console.error("Auto login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
