import express, { RequestHandler } from "express";
import {
  createAgent,
  getAgent,
  updateAgent,
  getAgentBySubdomain,
} from "../controller/agent.controller";
import { authenticateAgent } from "../middleware/auth.middleware";
import { uploadAgentAssets } from "../middleware/upload.middleware";

const router = express.Router();

// Public routes
router.get("/", getAgentBySubdomain as RequestHandler);

// Protected routes
router.use(authenticateAgent as RequestHandler);

// Protected routes
router.post("/", uploadAgentAssets, createAgent as RequestHandler);
router.get("/me", getAgent as RequestHandler);
router.patch("/profile", uploadAgentAssets, updateAgent as RequestHandler);

export default router;
