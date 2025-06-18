import express, { RequestHandler } from "express";
import {
  createContactRequest,
  getContactRequests,
} from "../controller/contact.controller";
import { authenticateAgent } from "../middleware/auth.middleware";

const router = express.Router();

router.post("/", createContactRequest as RequestHandler);
router.get(
  "/",
  authenticateAgent as RequestHandler,
  getContactRequests as RequestHandler
);

export default router;
