import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { createCommunitySchema } from "../validations/community.validation";

const prisma = new PrismaClient();

export const createCommunity = async (req: Request, res: Response) => {
  try {
    if (!req.agent?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Photo is required" });
    }

    const photoUrl = `/uploads/communities/${req.file.filename}`;

    const data = createCommunitySchema.parse({
      ...req.body,
      photo: photoUrl,
      agentId: req.agent.id,
    });

    const community = await prisma.community.create({
      data: {
        name: data.name,
        photo: photoUrl,
        description: data.description,
        highlights: data.highlights || [],
        homeStyles: data.homeStyles || [],
        link: data.link || "",
        agentId: req.agent.id,
      },
    });

    res.status(201).json({
      message: "Community created successfully",
      community,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        error: "Validation error",
        details: error.errors,
      });
    }
    console.error("Create community error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAgentCommunities = async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;

    const communities = await prisma.community.findMany({
      where: { agentId },
    });

    res.status(200).json({ communities });
  } catch (error) {
    console.error("Get communities error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateCommunity = async (req: Request, res: Response) => {
  try {
    if (!req.agent?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const communityId = req.params.id;
    const existing = await prisma.community.findUnique({
      where: { id: communityId },
    });
    if (!existing) {
      return res.status(404).json({ error: "Community not found" });
    }
    if (existing.agentId !== req.agent.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    let photoUrl = existing.photo;
    if (req.file) {
      photoUrl = `/uploads/communities/${req.file.filename}`;
    }

    // Normalize highlights and homeStyles to arrays
    function toArray(val: any) {
      if (Array.isArray(val)) return val;
      if (typeof val === "string") return [val];
      return [];
    }

    const highlights = req.body.highlights
      ? toArray(req.body.highlights)
      : undefined;
    const homeStyles = req.body.homeStyles
      ? toArray(req.body.homeStyles)
      : undefined;

    const {
      updateCommunitySchema,
    } = require("../validations/community.validation");
    const data = updateCommunitySchema.parse({
      id: communityId,
      ...req.body,
      photo: photoUrl,
      highlights,
      homeStyles,
    });

    const updated = await prisma.community.update({
      where: { id: communityId },
      data: {
        name: data.name,
        photo: data.photo,
        description: data.description,
        highlights: data.highlights,
        homeStyles: data.homeStyles,
        link: data.link,
      },
    });

    res.status(200).json({
      message: "Community updated successfully",
      community: updated,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        error: "Validation error",
        details: error.errors,
      });
    }
    console.error("Update community error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
