import express, { RequestHandler } from "express";
import {
  createProperty,
  updateProperty,
  getProperties,
  getPropertyById,
  getPropertiesByCommunity,
  getPropertiesByAgent,
  deleteProperty,
} from "../controller/property.controller";
import { authenticateAgent } from "../middleware/auth.middleware";
import { uploadPropertyFiles } from "../middleware/upload.middleware";

const router = express.Router();

// Create property
router.post(
  "/",
  authenticateAgent as RequestHandler,
  uploadPropertyFiles,
  createProperty as RequestHandler
);
// Get properties by agent ID (public route)
router.get("/agent", getPropertiesByAgent as RequestHandler);
// Get all properties with filtering and pagination
router.get("/", getProperties as RequestHandler);

// Update property
router.patch(
  "/:id",
  authenticateAgent as RequestHandler,
  uploadPropertyFiles,
  updateProperty as RequestHandler
);

// Get single property by ID
router.get("/:id", getPropertyById as RequestHandler);

// Get properties by community ID (public route)
router.get(
  "/community/:communityId",
  getPropertiesByCommunity as RequestHandler
);

// Delete property
router.delete(
  "/:id",
  authenticateAgent as RequestHandler,
  deleteProperty as RequestHandler
);

export default router;
