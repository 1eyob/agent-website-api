import { Request, Response } from "express";
import { PrismaClient, Agent } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Extend Express Request type to include agent
interface AuthenticatedRequest extends Request {
  agent?: Agent;
}

const contactRequestSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  address: z.string().min(1),
  interests: z.array(z.string()).optional(),
  message: z.string().min(1),
  subdomain: z.string().min(1),
});

export const createContactRequest = async (req: Request, res: Response) => {
  try {
    const data = contactRequestSchema.parse(req.body);

    // Check if agent exists with the given subdomain
    const agent = await prisma.agent.findUnique({
      where: { subdomain: data.subdomain },
    });

    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    const contactRequest = await prisma.contactRequest.create({
      data,
    });

    res
      .status(201)
      .json({ message: "Contact request submitted", contactRequest });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Validation error", errors: error.errors });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getContactRequests = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const agentId = req.agent?.id;
    if (!agentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get agent's subdomain
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { subdomain: true },
    });

    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    const requests = await prisma.contactRequest.findMany({
      where: { subdomain: agent.subdomain },
      orderBy: { createdAt: "desc" },
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
