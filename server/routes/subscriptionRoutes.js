// server/routes/subscriptionRoutes.js
import express from "express";
import { authenticateToken, isManager } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/adminMiddleware.js";
import {
  getPlans,
  createSubscription,
  getMySubscription,
  getAllSubscriptions
} from "../controllers/subscriptionController.js";

const router = express.Router();

// Public route - get plans
router.get("/plans", getPlans);

router.get("/my-subscription", authenticateToken, isManager, getMySubscription);
router.post("/subscribe", authenticateToken, isManager, createSubscription);
router.get("/all", authenticateToken, isAdmin, getAllSubscriptions);

export default router;

