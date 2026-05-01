import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";
import multer from "multer";

// Routes
import authRoutes from "./routes/auth.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import preferenceRoutes from "./routes/preferenceRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import restaurantManagerRoutes from "./routes/restaurantManagerRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import sentimentRoutes from "./routes/sentimentRoutes.js";
import dealRecommendationRoutes from "./routes/dealRecommendationRoutes.js";
import Restaurant from "./models/Restaurant.js";

// Middleware
import errorMiddleware from "./middleware/errorMiddleware.js";

dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads", "images");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✅ Created uploads/images directory");
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
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

app.use(express.json());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(cookieParser());

// Serve uploaded images statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URL, { dbName: "resturantfinder" })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ DB connection error:", err));

const checkAndUpdateDealsActivation = async () => {
  try {
    const now = new Date();
    const restaurants = await Restaurant.find();
    let updates = 0;
    for (const r of restaurants) {
      let changed = false;
      (r.deals || []).forEach(d => {
        if (d.status === "approved" && d.startTime && d.endTime) {
          const active = now >= new Date(d.startTime) && now <= new Date(d.endTime);
          if (d.isActive !== active) {
            d.isActive = active;
            changed = true;
            updates++;
          }
        } else if (d.isActive) {
          d.isActive = false;
          changed = true;
          updates++;
        }
      });
      if (changed) {
        await r.save();
      }
    }
    if (updates > 0) {
      console.log(`⏱ Updated deal activation states: ${updates}`);
    }
  } catch (e) {
    console.error("Error updating deal activation states:", e.message);
  }
};

setInterval(checkAndUpdateDealsActivation, 60000);
checkAndUpdateDealsActivation();
// Register routes
app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/user/favorites", favoriteRoutes);
app.use("/api/user/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user/preferences", preferenceRoutes);
app.use("/api/ai/recommendations", recommendationRoutes);
app.use("/api/manager", restaurantManagerRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/sentiment", sentimentRoutes);
app.use("/api/deals", dealRecommendationRoutes);

// Default route
app.get("/", (req, res) => res.send("🍽️ DineMate API is running"));

// Error Middleware
app.use(errorMiddleware);

const PORT = process.env.PORT || 7000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
