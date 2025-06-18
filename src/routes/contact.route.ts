import express, { RequestHandler } from "express";
import {
  createContactRequest,
  getContactRequests,
  markContactAsRead,
  markAllContactsAsRead,
} from "../controller/contact.controller";
import { authenticateAgent } from "../middleware/auth.middleware";

const router = express.Router();

router.post("/", createContactRequest as RequestHandler);
router.get(
  "/",
  authenticateAgent as RequestHandler,
  getContactRequests as RequestHandler
);
router.patch(
  "/:id/read",
  authenticateAgent as RequestHandler,
  markContactAsRead as RequestHandler
);
router.patch(
  "/bulk-read",
  authenticateAgent as RequestHandler,
  markAllContactsAsRead as RequestHandler
);

export default router;
