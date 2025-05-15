import express, { RequestHandler } from "express";
import {
  createAgent,
  getAgent,
  updateAgent,
  createTestimonial,
  updateTestimonial,
  getAgentTestimonials,
} from "../controller/agent.controller";
import { authenticateAgent } from "../middleware/auth.middleware";
import {
  uploadAgentProfilePhoto,
  uploadAgentAssets,
} from "../middleware/upload.middleware";

const router = express.Router();

// All routes are protected
router.use(authenticateAgent as RequestHandler);

// Protected routes
router.post("/", uploadAgentAssets, createAgent as RequestHandler);
router.get("/me", getAgent as RequestHandler);
router.patch("/profile", uploadAgentAssets, updateAgent as RequestHandler);

export default router;
