import express, { RequestHandler } from "express";
import {
  login,
  verifyOTP,
  autoLogin,
  passwordLogin,
} from "../controller/auth.controller";

const router = express.Router();

// Request OTP for login
router.post("/login", login as RequestHandler);

// Verify OTP and complete login
router.post("/verify-otp", verifyOTP as RequestHandler);

// Password-based login
router.post("/password-login", passwordLogin as RequestHandler);

router.post("/auto-login", autoLogin as RequestHandler);

export default router;
