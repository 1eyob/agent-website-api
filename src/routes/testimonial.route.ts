import express, { RequestHandler } from "express";
import {
  createTestimonial,
  updateTestimonial,
  getAgentTestimonials,
  deleteTestimonial,
} from "../controller/testimonial.controller";
import { authenticateAgent } from "../middleware/auth.middleware";

const router = express.Router();

// All testimonial routes are protected
router.use(authenticateAgent as RequestHandler);

router.post("/", createTestimonial as RequestHandler);
router.patch("/:id", updateTestimonial as RequestHandler);
router.get("/:agentId", getAgentTestimonials as RequestHandler);
router.delete("/:id", deleteTestimonial as RequestHandler);

export default router;
