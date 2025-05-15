import express, { RequestHandler } from "express";
import {
  createCommunity,
  getAgentCommunities,
  updateCommunity,
} from "../controller/community.controller";
import { authenticateAgent } from "../middleware/auth.middleware";
import { uploadCommunity } from "../middleware/upload.middleware";

const router = express.Router();

// Public routes
router.get("/agent/:agentId", getAgentCommunities as RequestHandler);

// Protected routes
router.use(authenticateAgent as RequestHandler);
router.post(
  "/",
  uploadCommunity.single("photo"),
  createCommunity as RequestHandler
);

router.patch(
  "/:id",
  uploadCommunity.single("photo"),
  updateCommunity as RequestHandler
);

export default router;
