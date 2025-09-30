import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all website generation jobs
export const getWebsiteGenerationJobs = async (req: Request, res: Response) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [jobs, total] = await Promise.all([
      prisma.websiteGenerationJob.findMany({
        where,
        include: {
          agent: {
            select: {
              id: true,
              fullName: true,
              email: true,
              subdomain: true,
              profilePhoto: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      prisma.websiteGenerationJob.count({ where }),
    ]);

    res.json({
      success: true,
      data: jobs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching website generation jobs:", error);
    res.status(500).json({
      error: "Failed to fetch website generation jobs",
    });
  }
};

// Get a specific website generation job by ID
export const getWebsiteGenerationJobById = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const job = await prisma.websiteGenerationJob.findUnique({
      where: { id },
      include: {
        agent: {
          select: {
            id: true,
            fullName: true,
            email: true,
            subdomain: true,
            profilePhoto: true,
            phone: true,
            bio: true,
          },
        },
      },
    });

    if (!job) {
      return res.status(404).json({
        error: "Website generation job not found",
      });
    }

    // Parse agentData if it exists
    const jobWithParsedData = {
      ...job,
      agentData: job.agentData ? JSON.parse(job.agentData) : null,
    };

    res.json({
      success: true,
      data: jobWithParsedData,
    });
  } catch (error) {
    console.error("Error fetching website generation job:", error);
    res.status(500).json({
      error: "Failed to fetch website generation job",
    });
  }
};

// Update website generation job status
export const updateWebsiteGenerationJobStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        error: "Status is required",
      });
    }

    // Validate status
    const validStatuses = [
      "PENDING",
      "IN_PROGRESS",
      "COMPLETED",
      "FAILED",
      "CANCELLED",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const job = await prisma.websiteGenerationJob.update({
      where: { id },
      data: { status },
      include: {
        agent: {
          select: {
            id: true,
            fullName: true,
            email: true,
            subdomain: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Job status updated successfully",
      data: job,
    });
  } catch (error: any) {
    console.error("Error updating website generation job:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        error: "Website generation job not found",
      });
    }

    res.status(500).json({
      error: "Failed to update website generation job",
    });
  }
};

// Delete website generation job
export const deleteWebsiteGenerationJob = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    await prisma.websiteGenerationJob.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Website generation job deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting website generation job:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        error: "Website generation job not found",
      });
    }

    res.status(500).json({
      error: "Failed to delete website generation job",
    });
  }
};
