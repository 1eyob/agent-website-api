import express, { RequestHandler } from "express";
import {
  createContactRequest,
  getContactRequests,
} from "../controller/contact.controller";

const router = express.Router();

router.post("/", createContactRequest as RequestHandler);
router.get("/", getContactRequests as RequestHandler);

export default router;
