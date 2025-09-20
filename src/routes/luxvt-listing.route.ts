import express, { RequestHandler } from "express";
import {
  createLuxvtListing,
  upsertLuxvtListings,
  getLuxvtListings,
  getLuxvtListingById,
  updateLuxvtListing,
  deleteLuxvtListing,
  getLuxvtListingsBySubdomain,
} from "../controller/luxvt-listing.controller";
import { authenticateAgent } from "../middleware/auth.middleware";

const router = express.Router();

// Public routes
router.get("/public", getLuxvtListingsBySubdomain as RequestHandler);

// Protected routes - require authentication
router.use(authenticateAgent as RequestHandler);

// CRUD operations for authenticated agents
router.post("/bulk", upsertLuxvtListings as RequestHandler); // Bulk upsert endpoint
router.post("/", createLuxvtListing as RequestHandler); // Single listing endpoint
router.get("/", getLuxvtListings as RequestHandler);
router.get("/:id", getLuxvtListingById as RequestHandler);
router.patch("/:id", updateLuxvtListing as RequestHandler);
router.delete("/:id", deleteLuxvtListing as RequestHandler);

export default router;
