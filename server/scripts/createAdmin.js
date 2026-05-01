// Create admin user script
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL, { dbName: "resturantfinder" });
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@dinemate.com" });
    if (existingAdmin) {
      console.log("❌ Admin user already exists");
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 12);
    const admin = new User({
      name: "Admin User",
      email: "admin@dinemate.com",
      password: hashedPassword,
      role: "admin",
      isAdmin: true
    });

    await admin.save();
    console.log("✅ Admin user created successfully!");
    console.log("📧 Email: admin@dinemate.com");
    console.log("🔑 Password: admin123");
    console.log("🔗 Use these credentials to login as admin");

  } catch (error) {
    console.error("❌ Error creating admin:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createAdmin();
