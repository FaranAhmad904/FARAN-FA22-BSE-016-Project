// server/routes/restaurantManagerRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import { authenticateToken, isManager } from "../middleware/authMiddleware.js";
import { uploadImage } from "../middleware/uploadMiddleware.js";
import {
  registerRestaurant,
  getMyRestaurant,
  updateMyRestaurant,
  addDeal,
  getMyDeals,
  updateDeal,
  deleteDeal,
  uploadDealImage,
  getManagerAnalytics
} from "../controllers/restaurantManagerController.js";

const router = express.Router();

// Configure multer for restaurant image uploads
const restaurantStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/images/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'restaurant-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const restaurantUpload = multer({ 
  storage: restaurantStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

router.use(authenticateToken, isManager);

// Analytics
router.get("/analytics", getManagerAnalytics);

// Restaurant management
router.post("/restaurant/register", restaurantUpload.single('image'), registerRestaurant);
router.get("/restaurant", getMyRestaurant);
router.put("/restaurant", restaurantUpload.single('image'), updateMyRestaurant);

// Deal management
router.post("/deals", addDeal);
router.get("/deals", getMyDeals);
router.put("/deals/:dealId", updateDeal);
router.delete("/deals/:dealId", deleteDeal);

// Image upload
router.post("/upload-image", uploadImage, uploadDealImage);

export default router;

