import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface JwtPayload {
  id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      agent?: {
        id: string;
        email: string;
      };
    }
  }
}

export const authenticateAgent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    ) as JwtPayload;

    const agent = await prisma.agent.findUnique({
      where: { id: decoded.id },
    });

    if (!agent) {
      return res.status(401).json({ error: "Agent not found" });
    }

    // Attach agent info to request
    req.agent = {
      id: agent.id,
      email: agent.email,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: "Invalid token" });
    }
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
