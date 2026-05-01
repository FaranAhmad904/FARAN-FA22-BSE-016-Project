import mongoose from "mongoose";
import dotenv from "dotenv";
import Restaurant from "../models/Restaurant.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const activateAllDeals = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, { dbName: "resturantfinder" });
    const now = new Date();
    const startDefault = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const endDefault = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const restaurants = await Restaurant.find({});
    let totalDealsUpdated = 0;
    for (const restaurant of restaurants) {
      let changed = false;
      (restaurant.deals || []).forEach(deal => {
        deal.status = "approved";
        if (!deal.startTime) deal.startTime = startDefault;
        if (!deal.endTime) deal.endTime = endDefault;
        const active = now >= new Date(deal.startTime) && now <= new Date(deal.endTime);
        deal.isActive = active;
        changed = true;
        totalDealsUpdated++;
      });
      if (changed) {
        await restaurant.save();
      }
    }
    console.log(`✅ Activated ${totalDealsUpdated} deals`);
    await mongoose.connection.close();
    console.log("✅ Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

activateAllDeals();
