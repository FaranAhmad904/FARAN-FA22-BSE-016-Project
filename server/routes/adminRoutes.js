// server/routes/adminRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import { isAdmin } from "../middleware/adminMiddleware.js";
import { uploadImage } from "../middleware/uploadMiddleware.js";
import {
  getDashboardStats,
  getAllRestaurants,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  createDeal,
  updateDeal,
  deleteDeal,
  uploadMenu,
  uploadDealImage,
  getPendingRestaurants,
  approveRestaurant,
  rejectRestaurant,
  getPendingDeals,
  approveDeal,
  rejectDeal,
  getRestaurantAnalytics
} from "../controllers/adminController.js";

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

// All admin routes require admin authentication
router.use(isAdmin);

// Dashboard
router.get("/dashboard", getDashboardStats);
router.get("/dashboard/:restaurantId", getRestaurantAnalytics);

// Restaurant management
router.get("/restaurants", getAllRestaurants);
router.post("/restaurants", restaurantUpload.single('image'), createRestaurant);
router.put("/restaurants/:id", restaurantUpload.single('image'), updateRestaurant);
router.delete("/restaurants/:id", deleteRestaurant);

// Deal management
router.post("/restaurants/:restaurantId/deals", createDeal);
router.put("/restaurants/:restaurantId/deals/:dealId", updateDeal);
router.delete("/restaurants/:restaurantId/deals/:dealId", deleteDeal);

// Menu upload
router.post("/restaurants/:restaurantId/menu", uploadMenu);

// Image upload for deals
router.post("/upload-image", uploadImage, uploadDealImage);

// Approval management
router.get("/pending/restaurants", getPendingRestaurants);
router.put("/restaurants/:id/approve", approveRestaurant);
router.put("/restaurants/:id/reject", rejectRestaurant);
router.get("/pending/deals", getPendingDeals);
router.put("/restaurants/:restaurantId/deals/:dealId/approve", approveDeal);
router.put("/restaurants/:restaurantId/deals/:dealId/reject", rejectDeal);

export default router;
