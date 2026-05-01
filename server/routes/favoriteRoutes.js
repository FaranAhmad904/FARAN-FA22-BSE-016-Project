// server/routes/favoriteRoutes.js
import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import {
  addFavorite,
  getFavorites,
  removeFavorite,
} from "../controllers/favoriteController.js";

const router = express.Router();

router.post("/", authenticateToken, addFavorite);
router.get("/", authenticateToken, getFavorites);
router.delete("/:dealId", authenticateToken, removeFavorite);

export default router;
