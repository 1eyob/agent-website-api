import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import {
  createTestimonialSchema,
  updateTestimonialSchema,
} from "../validations/agent.validation";

const prisma = new PrismaClient();

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

export const deleteTestimonial = async (req: Request, res: Response) => {
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
    await prisma.testimonial.delete({ where: { id: testimonialId } });
    res.status(200).json({ message: "Testimonial deleted successfully" });
  } catch (error: any) {
    console.error("Delete testimonial error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
