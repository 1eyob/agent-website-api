import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import {
  CreateAgentInput,
  createAgentSchema,
  createTestimonialSchema,
  updateTestimonialSchema,
} from "../validations/agent.validation";
import { z } from "zod";
import OpenAI from "openai";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const prisma = new PrismaClient();

const openai = new OpenAI({
  apiKey:
    process.env.OPENAI_API_KEY ||
    "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",
});

const updateAgentSchema = createAgentSchema.partial();

export const createAgent = async (req: Request, res: Response) => {
  try {
    // Get file paths from uploaded files (multer.fields)
    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };
    const profilePhotoPath = files?.profilePhoto?.[0]
      ? `/uploads/agents/${files.profilePhoto[0].filename}`
      : req.body.profilePhoto;
    const logoPath = files?.logo?.[0]
      ? `/uploads/agents/${files.logo[0].filename}`
      : req.body.logo;
    const heroImagePath = files?.heroImage?.[0]
      ? `/uploads/agents/${files.heroImage[0].filename}`
      : req.body.heroImage;
    const heroVideoPath = files?.heroVideo?.[0]
      ? `/uploads/agents/${files.heroVideo[0].filename}`
      : req.body.heroVideo;

    // Create a modified data object that includes the file paths
    const data = createAgentSchema.parse({
      ...req.body,
      profilePhoto: profilePhotoPath,
      logo: logoPath,
      heroImage: heroImagePath,
      heroVideo: heroVideoPath,
    });

    // Check if email or subdomain already exists
    const existingAgent = await prisma.agent.findFirst({
      where: {
        OR: [{ email: data.email }, { subdomain: data.subdomain }],
      },
    });

    if (existingAgent) {
      return res.status(400).json({
        error:
          existingAgent.email === data.email
            ? "Email already exists"
            : "Subdomain already exists",
      });
    }

    const createData: Prisma.AgentCreateInput = {
      subdomain: data.subdomain,
      fullName: data.fullName,
      email: data.email,
      officeHours: data.officeHours,
      phone: data.phone || "",
      profilePhoto: data.profilePhoto || "", // Use empty string as fallback
      bio: data.bio,
      logo: data.logo,
      heroImage: data.heroImage,
      theme: data.theme,
      instagramUrl: data.instagramUrl,
      blogUrl: data.blogUrl,
    };

    const agent = await prisma.agent.create({
      data: createData,
    });

    res.status(201).json({
      message: "Agent created successfully",
      agent: {
        id: agent.id,
        email: agent.email,
        fullName: agent.fullName,
        subdomain: agent.subdomain,
        profilePhoto: agent.profilePhoto,
        bio: agent.bio,
        phone: agent.phone,
        officeHours: agent.officeHours,
        logo: agent.logo,
        heroImage: agent.heroImage,
        theme: agent.theme,
        instagramUrl: agent.instagramUrl,
        blogUrl: agent.blogUrl,
        published: agent.published,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
      },
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        error: "Validation error",
        details: error.errors,
      });
    }
    console.error("Create agent error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAgent = async (req: Request, res: Response) => {
  try {
    console.log("get agent");
    const agentId = (req as any).agent?.id;

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        communities: true,
        testimonials: true,
        properties: true,
        luxvtListings: true,
      },
    });

    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    res.status(200).json({ agent });
  } catch (error) {
    console.error("Get agent error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateAgent = async (req: Request, res: Response) => {
  try {
    // Assume req.user.id is available from authentication middleware
    const agentId = (req as any).agent?.id;
    if (!agentId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get file paths from uploaded files (multer.fields)
    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };
    const profilePhotoPath = files?.profilePhoto?.[0]
      ? `/uploads/agents/${files.profilePhoto[0].filename}`
      : undefined;
    const logoPath = files?.logo?.[0]
      ? `/uploads/agents/${files.logo[0].filename}`
      : undefined;
    const heroImagePath = files?.heroImage?.[0]
      ? `/uploads/agents/${files.heroImage[0].filename}`
      : undefined;
    const heroVideoPath = files?.heroVideo?.[0]
      ? `/uploads/agents/${files.heroVideo[0].filename}`
      : undefined;

    // Merge request body and file paths
    const updateData = {
      ...req.body,
      ...(profilePhotoPath && { profilePhoto: profilePhotoPath }),
      ...(logoPath && { logo: logoPath }),
      ...(heroImagePath && { heroImage: heroImagePath }),
      ...(heroVideoPath && { heroVideo: heroVideoPath }),
    };

    // Validate update data
    const validatedData = updateAgentSchema.parse(updateData);

    // Check for subdomain uniqueness if subdomain is being updated
    if (validatedData.subdomain) {
      const existingAgent = await prisma.agent.findFirst({
        where: {
          subdomain: validatedData.subdomain,
          id: { not: agentId }, // Exclude current agent
        },
      });

      if (existingAgent) {
        return res.status(400).json({
          error: "Subdomain is already taken by another agent",
        });
      }
    }

    // Check for luxvtId uniqueness if luxvtId is being updated
    if (validatedData.luxvtId) {
      const existingLuxvtAgent = await prisma.agent.findFirst({
        where: {
          luxvtId: validatedData.luxvtId,
          id: { not: agentId }, // Exclude current agent
        },
      });

      if (existingLuxvtAgent) {
        return res.status(400).json({
          error: "LuxVT ID is already taken by another agent",
        });
      }
    }

    // Update agent
    const updatedAgent = await prisma.agent.update({
      where: { id: agentId },
      data: validatedData,
    });

    res.status(200).json({
      message: "Agent updated successfully",
      agent: updatedAgent,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        error: "Validation error",
        details: error.errors,
      });
    }
    console.error("Update agent error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createTestimonial = async (req: Request, res: Response) => {
  try {
    if (!req.agent?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const data = createTestimonialSchema.parse({
      ...req.body,
      agentId: req.agent.id,
    });
    const testimonial = await prisma.testimonial.create({ data });
    res
      .status(201)
      .json({ message: "Testimonial created successfully", testimonial });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res
        .status(400)
        .json({ error: "Validation error", details: error.errors });
    }
    console.error("Create testimonial error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateTestimonial = async (req: Request, res: Response) => {
  try {
    if (!req.agent?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const testimonialId = req.params.id;
    const existing = await prisma.testimonial.findUnique({
      where: { id: testimonialId },
    });
    if (!existing) {
      return res.status(404).json({ error: "Testimonial not found" });
    }
    if (existing.agentId !== req.agent.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const data = updateTestimonialSchema.parse({
      id: testimonialId,
      ...req.body,
    });
    const updated = await prisma.testimonial.update({
      where: { id: testimonialId },
      data,
    });
    res.status(200).json({
      message: "Testimonial updated successfully",
      testimonial: updated,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res
        .status(400)
        .json({ error: "Validation error", details: error.errors });
    }
    console.error("Update testimonial error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAgentTestimonials = async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const testimonials = await prisma.testimonial.findMany({
      where: { agentId },
    });
    res.status(200).json({ testimonials });
  } catch (error: any) {
    console.error("Get testimonials error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAgentBySubdomain = async (req: Request, res: Response) => {
  try {
    const { subdomain } = req.query;

    if (!subdomain || typeof subdomain !== "string") {
      return res.status(400).json({ error: "Subdomain is required" });
    }

    console.log("Fetching agent with subdomain:", subdomain);

    const agent = await prisma.agent.findUnique({
      where: { subdomain },
      include: {
        communities: {
          select: {
            id: true,
            name: true,
            photo: true,
            description: true,
            highlights: true,
            homeStyles: true,
            link: true,
          },
        },
        testimonials: {
          select: {
            id: true,
            name: true,
            content: true,
          },
        },
        properties: {
          select: {
            id: true,
            type: true,
            title: true,
            address: true,
            price: true,
            status: true,
            isFeatured: true,
            bedrooms: true,
            bathrooms: true,
            description: true,
            squareFootage: true,
            yearBuilt: true,
            lotSize: true,
            garage: true,
            features: true,
            photos: true,
            videoUrl: true,
            link: true,
            community: {
              select: {
                id: true,
                name: true,
                photo: true,
              },
            },
          },
        },
        luxvtListings: {
          select: {
            id: true,
            listingId: true,
            address: true,
            photo: true,
            website: true,
            city: true,
            state: true,
            currency: true,
            squareFeet: true,
            unitOfMeasurement: true,
            propertyName: true,
            price: true,
          },
        },
      },
    });

    // Filter out unpublished properties
    const publishedProperties = agent?.properties.filter(
      (property) => property.status !== "OFF_MARKET"
    );

    // Return only the necessary public data
    const publicAgentData = {
      id: agent?.id,
      subdomain: agent?.subdomain,
      fullName: agent?.fullName,
      profilePhoto: agent?.profilePhoto,
      bio: agent?.bio,
      theme: agent?.theme,
      email: agent?.email,
      phone: agent?.phone,
      officeHours: agent?.officeHours,
      logo: agent?.logo,
      heroImage: agent?.heroImage,
      heroVideo: agent?.heroVideo,
      heroTitle: agent?.heroTitle,
      heroSubtitle: agent?.heroSubtitle,
      instagramUrl: agent?.instagramUrl,
      twitterUrl: agent?.twitterUrl,
      facebookUrl: agent?.facebookUrl,
      linkedInUrl: agent?.linkedInUrl,
      blogUrl: agent?.blogUrl,
      title: agent?.title,

      // LuxVT API fields
      luxvtId: agent?.luxvtId,
      city: agent?.city,
      state: agent?.state,
      country: agent?.country,
      zip: agent?.zip,
      license: agent?.license,
      website: agent?.website,
      isElite: agent?.isElite,
      brokerage: agent?.brokerage,
      agentGrade: agent?.agentGrade,

      communities: agent?.communities,
      testimonials: agent?.testimonials,
      properties: publishedProperties,
    };

    res.status(200).json({ agent: publicAgentData });
  } catch (error) {
    console.error("Get agent by subdomain error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// POST /api/v1/agent/generate-website
export const generateWebsite = async (req: Request, res: Response) => {
  try {
    const { subdomain, prompt, agentData } = req.body;
    const agentId = (req as any).agent?.id; // from auth middleware

    if (!agentId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Step 1: Optionally enhance/refine the prompt using OpenAI
    const refinedPrompt = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an expert at creating prompts for website builders. Refine and optimize the following prompt to create a stunning real estate agent website.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const enhancedPrompt = refinedPrompt.choices[0].message.content;

    if (!enhancedPrompt) {
      return res.status(500).json({ error: "Failed to generate prompt" });
    }

    // Step 2: Save the enhanced prompt to a file
    const promptsDir = path.join(__dirname, "../../prompts");

    // Create prompts directory if it doesn't exist
    if (!fs.existsSync(promptsDir)) {
      fs.mkdirSync(promptsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${subdomain}_${timestamp}.txt`;
    const filepath = path.join(promptsDir, filename);

    // Create file content with metadata
    const fileContent = `Agent: ${agentData?.fullName || "Unknown"}
Subdomain: ${subdomain}
Generated: ${new Date().toLocaleString()}

=== ORIGINAL PROMPT ===
${prompt}

=== ENHANCED PROMPT ===
${enhancedPrompt}

=== AGENT DATA ===
${agentData ? JSON.stringify(agentData, null, 2) : "No agent data provided"}
`;

    fs.writeFileSync(filepath, fileContent, "utf-8");
    console.log(`Prompt saved to: ${filepath}`);

    // Step 3: Send to Lovable API (or manually create the site)
    // Note: Lovable might not have a public API yet
    // You might need to:
    // - Use their CLI programmatically
    // - Manually create projects
    // - Or use a different website builder with an API

    // For now, save the prompt and mark for manual processing
    await prisma.websiteGenerationJob.create({
      data: {
        agentId,
        subdomain,
        rawPrompt: prompt,
        prompt: enhancedPrompt,
        agentData: agentData ? JSON.stringify(agentData) : null,
        status: "PENDING",
      },
    });

    // Update agent's subdomain
    await prisma.agent.update({
      where: { id: agentId },
      data: { subdomain },
    });

    res.json({
      success: true,
      message: "Website generation initiated",
      subdomain,
      promptFile: filename,
    });
  } catch (error: any) {
    console.error("Error generating website:", error);
    res.status(500).json({ error: "Failed to generate website" });
  }
};
