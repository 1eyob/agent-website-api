import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import {
  CreateAgentInput,
  createAgentSchema,
  createTestimonialSchema,
  updateTestimonialSchema,
} from "../validations/agent.validation";
import { z } from "zod";

const prisma = new PrismaClient();

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
