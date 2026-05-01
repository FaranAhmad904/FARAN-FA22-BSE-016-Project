// server/routes/preferenceRoutes.js
import express from "express";
import { savePreferences, getPreferences } from "../controllers/preferenceController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Save or update user preferences
router.post("/", savePreferences);

// Get user preferences
router.get("/", getPreferences);

export default router;

