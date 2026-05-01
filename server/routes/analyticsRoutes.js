import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { recordView, recordClick } from "../controllers/analyticsController.js";

const router = express.Router();

router.post("/view", authenticateToken, recordView);
router.post("/click", authenticateToken, recordClick);

export default router;
