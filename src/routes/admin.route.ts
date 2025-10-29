import express, { RequestHandler } from "express";
import {
  getWebsiteGenerationJobs,
  getWebsiteGenerationJobById,
  updateWebsiteGenerationJobStatus,
  deleteWebsiteGenerationJob,
  sendWebsiteLiveEmailToAgent,
} from "../controller/admin.controller";
import { authenticateAgent } from "../middleware/auth.middleware";

const router = express.Router();

// Apply authentication middleware to all routes
// TODO: Add admin-only middleware for production
router.use(authenticateAgent as RequestHandler);

// Get all website generation jobs
router.get("/website-jobs", getWebsiteGenerationJobs as RequestHandler);

// Get a specific website generation job by ID
router.get("/website-jobs/:id", getWebsiteGenerationJobById as RequestHandler);

// Update website generation job status
router.patch(
  "/website-jobs/:id/status",
  updateWebsiteGenerationJobStatus as RequestHandler
);

// Delete website generation job
router.delete(
  "/website-jobs/:id",
  deleteWebsiteGenerationJob as RequestHandler
);

// Send website live email to an agent
router.post(
  "/agents/:id/website-live-email",
  sendWebsiteLiveEmailToAgent as RequestHandler
);

export default router;
