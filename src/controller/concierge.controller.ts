import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Create a new concierge request
export const createConciergeRequest = async (req: Request, res: Response) => {
  try {
    const {
      fullName,
      email,
      phone,
      company,
      designStyle,
      primaryColor,
      mustHaveFeatures,
      bio,
      specialRequests,
    } = req.body;

    const agentId = (req as any).agent?.id;

    if (!agentId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Validate required fields
    if (!fullName || !email || !phone) {
      return res.status(400).json({
        error: "Full name, email, and phone are required",
      });
    }

    const conciergeRequest = await prisma.conciergeRequest.create({
      data: {
        fullName,
        email,
        phone,
        company,
        designStyle,
        primaryColor,
        mustHaveFeatures: mustHaveFeatures || [],
        bio,
        specialRequests,
        agentId,
      },
      include: {
        agent: {
          select: {
            id: true,
            fullName: true,
            subdomain: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: conciergeRequest,
    });
  } catch (error) {
    console.error("Error creating concierge request:", error);
    res.status(500).json({
      error: "Failed to create concierge request",
    });
  }
};

// Get all concierge requests for the authenticated agent
export const getConciergeRequests = async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).agent?.id;

    if (!agentId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { page = 1, limit = 10, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause
    const where: any = { agentId };
    if (status) {
      where.status = status;
    }

    const [conciergeRequests, total] = await Promise.all([
      prisma.conciergeRequest.findMany({
        where,
        include: {
          agent: {
            select: {
              id: true,
              fullName: true,
              subdomain: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      prisma.conciergeRequest.count({ where }),
    ]);

    res.json({
      success: true,
      data: conciergeRequests,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching concierge requests:", error);
    res.status(500).json({
      error: "Failed to fetch concierge requests",
    });
  }
};

// Get a specific concierge request by ID
export const getConciergeRequestById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const agentId = (req as any).agent?.id;

    if (!agentId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const conciergeRequest = await prisma.conciergeRequest.findFirst({
      where: {
        id,
        agentId, // Ensure the request belongs to the authenticated agent
      },
      include: {
        agent: {
          select: {
            id: true,
            fullName: true,
            subdomain: true,
          },
        },
      },
    });

    if (!conciergeRequest) {
      return res.status(404).json({
        error: "Concierge request not found",
      });
    }

    res.json({
      success: true,
      data: conciergeRequest,
    });
  } catch (error) {
    console.error("Error fetching concierge request:", error);
    res.status(500).json({
      error: "Failed to fetch concierge request",
    });
  }
};

// Update a concierge request
export const updateConciergeRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const agentId = (req as any).agent?.id;

    if (!agentId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const {
      fullName,
      email,
      phone,
      company,
      designStyle,
      primaryColor,
      mustHaveFeatures,
      bio,
      specialRequests,
      status,
      adminNotes,
      assignedTo,
      contactAttempts,
      lastContacted,
    } = req.body;

    // First check if the request exists and belongs to the agent
    const existingRequest = await prisma.conciergeRequest.findFirst({
      where: {
        id,
        agentId,
      },
    });

    if (!existingRequest) {
      return res.status(404).json({
        error: "Concierge request not found",
      });
    }

    // Prepare update data
    const updateData: any = {};

    if (fullName !== undefined) updateData.fullName = fullName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (company !== undefined) updateData.company = company;
    if (designStyle !== undefined) updateData.designStyle = designStyle;
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor;
    if (mustHaveFeatures !== undefined)
      updateData.mustHaveFeatures = mustHaveFeatures;
    if (bio !== undefined) updateData.bio = bio;
    if (specialRequests !== undefined)
      updateData.specialRequests = specialRequests;
    if (status !== undefined) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (contactAttempts !== undefined)
      updateData.contactAttempts = contactAttempts;
    if (lastContacted !== undefined) updateData.lastContacted = lastContacted;

    const updatedRequest = await prisma.conciergeRequest.update({
      where: { id },
      data: updateData,
      include: {
        agent: {
          select: {
            id: true,
            fullName: true,
            subdomain: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedRequest,
    });
  } catch (error) {
    console.error("Error updating concierge request:", error);
    res.status(500).json({
      error: "Failed to update concierge request",
    });
  }
};

// Delete a concierge request
export const deleteConciergeRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const agentId = (req as any).agent?.id;

    if (!agentId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if the request exists and belongs to the agent
    const existingRequest = await prisma.conciergeRequest.findFirst({
      where: {
        id,
        agentId,
      },
    });

    if (!existingRequest) {
      return res.status(404).json({
        error: "Concierge request not found",
      });
    }

    await prisma.conciergeRequest.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Concierge request deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting concierge request:", error);
    res.status(500).json({
      error: "Failed to delete concierge request",
    });
  }
};
