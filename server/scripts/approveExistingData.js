// server/scripts/approveExistingData.js
// Script to approve all existing restaurants and deals in the database
import mongoose from "mongoose";
import dotenv from "dotenv";
import Restaurant from "../models/Restaurant.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const approveExistingData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL, { dbName: "resturantfinder" });
    console.log("✅ Connected to MongoDB");

    // Update all restaurants without status or with pending status to approved
    const restaurantResult1 = await Restaurant.updateMany(
      { status: { $exists: false } }, // Update restaurants without status field
      { $set: { status: 'approved' } }
    );
    console.log(`✅ Approved ${restaurantResult1.modifiedCount} restaurants (that didn't have status)`);

    const restaurantResult2 = await Restaurant.updateMany(
      { status: 'pending' },
      { $set: { status: 'approved' } }
    );
    console.log(`✅ Approved ${restaurantResult2.modifiedCount} pending restaurants`);

    // Get all restaurants and update their deals
    const restaurants = await Restaurant.find({});
    let totalDealsUpdated = 0;

    for (const restaurant of restaurants) {
      let dealsUpdated = false;
      
      if (restaurant.deals && restaurant.deals.length > 0) {
        restaurant.deals.forEach(deal => {
          // If deal doesn't have status field or is pending, set to approved
          if (!deal.status || deal.status === 'pending') {
            deal.status = 'approved';
            dealsUpdated = true;
            totalDealsUpdated++;
          }
        });

        if (dealsUpdated) {
          await restaurant.save();
        }
      }
    }

    console.log(`✅ Approved ${totalDealsUpdated} deals`);
    console.log("✅ All existing data has been approved!");

    // Close connection
    await mongoose.connection.close();
    console.log("✅ Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

approveExistingData();
