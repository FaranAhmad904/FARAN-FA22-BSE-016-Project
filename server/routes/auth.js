// server/routes/auth.js
import express from "express";
import { signup, login, getProfile } from "../controllers/authController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();
router.post("/signup", signup);
router.post("/login", login);
router.get("/profile", authenticateToken, getProfile);

export default router;
