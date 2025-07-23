import express, { RequestHandler } from "express";
import {
  createConciergeRequest,
  getConciergeRequests,
  getConciergeRequestById,
  updateConciergeRequest,
  deleteConciergeRequest,
} from "../controller/concierge.controller";
import { authenticateAgent } from "../middleware/auth.middleware";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateAgent as RequestHandler);

// Create a new concierge request
router.post("/", createConciergeRequest as RequestHandler);

// Get all concierge requests for the authenticated agent
router.get("/", getConciergeRequests as RequestHandler);

// Get a specific concierge request by ID
router.get("/:id", getConciergeRequestById as RequestHandler);

// Update a concierge request
router.put("/:id", updateConciergeRequest as RequestHandler);

// Delete a concierge request
router.delete("/:id", deleteConciergeRequest as RequestHandler);

export default router;
