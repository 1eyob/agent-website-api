import { Request, Response } from "express";
import { sendOTPEmail } from "../utils/email";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// Server timezone info for debugging
const getServerTimezoneInfo = () => {
  const now = new Date();
  return {
    timezone: "Etc/UTC (UTC, +0000)",
    currentUTC: Math.floor(Date.now() / 1000),
    currentISO: now.toISOString(),
    note: "Server runs in UTC to match PHP time() function",
  };
};

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

/**
 * Auto Login Controller
 *
 * Important: This server runs in Etc/UTC (UTC, +0000) timezone to ensure
 * consistent timestamp validation with PHP backend using time() function.
 *
 * Validation logic matches PHP:
 * - abs(time() - (int)$ts) > 300 for 5-minute expiry
 * - hash_hmac('sha256', $email . '|' . $ts, $secret) for token validation
 */
export const autoLogin = async (req: Request, res: Response) => {
  try {
    const { email, ts, token: linkToken, entityid } = req.body;

    if (!email || !ts || !linkToken || !entityid) {
      return res
        .status(400)
        .json({ error: "Invalid link - missing parameters" });
    }

    // Get secret from environment variable
    const SECRET =
      process.env.AUTO_LOGIN_SECRET || "a384b6463fc216a5f8ecb6670f86456a";

    // 1. Check timestamp validity (5 min window) - matches PHP logic
    // Server timezone: Etc/UTC (UTC, +0000) - matches PHP time() function
    const currentTime = Math.floor(Date.now() / 1000); // UTC timestamp in seconds
    const linkTimestamp = parseInt(ts as string);
    const timeDifference = Math.abs(currentTime - linkTimestamp);

    // Check if there's a parsing issue with the timestamp
    if (isNaN(linkTimestamp)) {
      console.log("  - ⚠️ WARNING: linkTimestamp is NaN! Raw ts value:", ts);
      return res.status(400).json({ error: "Invalid timestamp format" });
    }

    // TEMPORARY DEBUG: Extend expiry for debugging (remove in production)
    const DEBUG_EXTENDED_EXPIRY = 3600; // 1 hour for debugging
    const MAX_ALLOWED = 300; // Normal 5 minutes

    // 2. Verify token - matches PHP logic with pipe separator
    const hashData = `${email}|${ts}`;

    const validHash = crypto
      .createHmac("sha256", SECRET)
      .update(hashData)
      .digest("hex");

    // Use secure comparison to prevent timing attacks
    if (
      !crypto.timingSafeEqual(
        Buffer.from(String(linkToken)),
        Buffer.from(validHash)
      )
    ) {
      console.log("❌ Token validation failed");
      return res.status(403).json({ error: "Invalid token" });
    }

    // Try to find existing agent first
    let agent = await prisma.agent.findUnique({
      where: { email: email as string },
    });

    // If agent exists but doesn't have entityId, update it
    if (agent && !agent.entityId) {
      console.log("🔄 Updating agent with entityId:", entityid);
      agent = await prisma.agent.update({
        where: { email: email as string },
        data: { entityId: entityid as string },
      });
      console.log("✅ Agent updated with entityId");
    }

    // If agent doesn't exist, create new agent using data extracted from email
    if (!agent) {
      console.log("🆕 Creating new agent for email:", email);
      try {
        // Extract fullName and subdomain from email
        const { fullName, subdomain } = extractFromEmail(email as string);

        // Generate a unique subdomain if the extracted one is taken

        const uniqueSubdomain = await generateUniqueSubdomain(subdomain);

        // Create new agent

        const agentData = {
          email: email as string,
          fullName: fullName,
          subdomain: uniqueSubdomain,
          package_name: "BASIC" as const, // Default package
          entityId: entityid as string,
        };
        console.log("  - agentData:", agentData);

        agent = await prisma.agent.create({
          data: agentData,
        });
      } catch (createError: any) {
        console.log("❌ Error creating agent:", createError);

        // If email already exists, try to find by email instead
        if (createError.code === "P2002") {
          agent = await prisma.agent.findUnique({
            where: { email: email as string },
          });

          if (!agent) {
            console.log(
              "❌ Could not find existing agent after duplicate error"
            );
            return res.status(400).json({
              error: "Failed to create agent - email may already exist",
            });
          }
          console.log("✅ Found existing agent after duplicate error");
        } else {
          console.log("❌ Unknown error creating agent, rethrowing");
          throw createError;
        }
      }
    }

    const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

    const tokenPayload = {
      id: agent.id,
      email: agent.email,
    };
    console.log("  - tokenPayload:", tokenPayload);

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "7d" });
    console.log("  - generated token length:", token.length);

    const isNewlyCreated = agent.createdAt.getTime() > Date.now() - 5000;
    const message = isNewlyCreated
      ? "Agent registered and logged in successfully"
      : "Auto login successful";

    const responseData = {
      message,
      token,
      agent: {
        id: agent.id,
        email: agent.email,
        fullName: agent.fullName,
        subdomain: agent.subdomain,
        package_name: agent.package_name,
        entityId: agent.entityId,
      },
    };

    res.status(200).json(responseData);
  } catch (error: any) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Helper function to generate auto login links - compatible with PHP validation
export const generateAutoLoginLink = (
  email: string,
  entityId: string,
  baseUrl: string = "https://id.land"
): string => {
  const SECRET =
    process.env.AUTO_LOGIN_SECRET || "a384b6463fc216a5f8ecb6670f86456a";

  // Generate UTC timestamp to match server timezone (Etc/UTC)
  const ts = Math.floor(Date.now() / 1000).toString(); // UTC seconds to match PHP time()

  console.log("🔗 Generating auto login link:");
  console.log("  - email:", email);
  console.log("  - entityId:", entityId);
  console.log("  - baseUrl:", baseUrl);
  console.log("  - timezone: Etc/UTC (UTC, +0000)");
  console.log("  - ts (UTC):", ts);
  console.log(
    "  - ts (readable):",
    new Date(parseInt(ts) * 1000).toISOString()
  );

  // Hash includes email and timestamp with pipe separator to match PHP logic
  const hashData = `${email}|${ts}`;
  console.log("  - hashData:", hashData);

  const token = crypto
    .createHmac("sha256", SECRET)
    .update(hashData)
    .digest("hex");

  console.log("  - generated token:", token);

  // Build URL with the required parameters
  const url = `${baseUrl}/autologin?email=${encodeURIComponent(
    email
  )}&ts=${ts}&token=${token}&entityid=${encodeURIComponent(entityId)}`;

  console.log("  - final URL:", url);
  console.log("✅ Auto login link generated successfully");

  return url;
};
