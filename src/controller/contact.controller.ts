import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const contactRequestSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  interests: z.array(z.string()).optional(),
  address: z.string().min(1),
  message: z.string().min(1),
});

export const createContactRequest = async (req: Request, res: Response) => {
  try {
    const data = contactRequestSchema.parse(req.body);
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

export const getContactRequests = async (_req: Request, res: Response) => {
  try {
    const requests = await prisma.contactRequest.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
