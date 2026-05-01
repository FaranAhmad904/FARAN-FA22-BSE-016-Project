import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { getDealReviews, addReview, updateReview } from "../controllers/reviewController.js";

const router = express.Router();
// Get reviews for a deal (public endpoint - no auth required)
router.get("/restaurant/:restaurantId/deal/:dealId", getDealReviews);
// Add/update reviews (requires authentication)
router.post("/", authenticateToken, addReview);
router.put("/:id", authenticateToken, updateReview);

export default router;