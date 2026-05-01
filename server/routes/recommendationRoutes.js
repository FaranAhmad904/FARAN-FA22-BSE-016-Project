// server/routes/recommendationRoutes.js
import express from "express";
import { getRecommendations } from "../controllers/recommendationController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get AI recommendations
router.get("/", getRecommendations);

export default router;

