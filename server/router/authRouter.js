import { Router } from "express";
import { login, checker, verifyOtp } from "../controller/authController.js";

const router = Router();

/**
 * Route to handle user login.
 * This route accepts a POST request with user credentials,
 * and returns a response indicating success or failure.
 * @route POST /login
 * @returns {Object} Response object with status and message
 */
router.post("/login", login);
/**
 * Route to check user authentication status.
 * This route accepts a POST request with user UID,
 * and returns a response indicating whether the user is authenticated.
 * @route POST /checker
 * @returns {Object} Response object with status and message
 */
router.post("/checker", checker);

/**
 * Route to verify OTP for user login.
 * This route accepts a POST request with user UID and window ID,
 * and returns a response indicating whether the OTP verification was successful.
 *  @route POST /verify-otp
 * @returns {Object} Response object with status and message
 */
router.post("/verify-otp", verifyOtp);

export default router;
