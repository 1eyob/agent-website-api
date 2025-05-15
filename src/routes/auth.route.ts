import express, { RequestHandler } from "express";
import { login, verifyOTP } from "../controller/auth.controller";

const router = express.Router();

// Request OTP for login
router.post("/login", login as RequestHandler);

// Verify OTP and complete login
router.post("/verify-otp", verifyOTP as RequestHandler);

export default router;
