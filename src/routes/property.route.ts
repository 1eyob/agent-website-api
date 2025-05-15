import express, { RequestHandler } from "express";
import {
  createProperty,
  updateProperty,
  getProperties,
  getPropertyById,
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

// Update property
router.patch(
  "/:id",
  authenticateAgent as RequestHandler,
  uploadPropertyFiles,
  updateProperty as RequestHandler
);

// Get all properties with filtering and pagination
router.get("/", getProperties as RequestHandler);

// Get single property by ID
router.get("/:id", getPropertyById as RequestHandler);

export default router;
