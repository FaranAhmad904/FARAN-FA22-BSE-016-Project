// server/scripts/migrateDealInteractions.js
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017";
const DB_NAME = "resturantfinder";
const COLL = "userpreferences";

const run = async () => {
  try {
    await mongoose.connect(MONGO_URL, { dbName: DB_NAME });
    const db = mongoose.connection.db;
    const col = db.collection(COLL);

    let updated = 0;
    const cursor = col.find({});
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (doc && Array.isArray(doc.dealInteractions)) {
        continue;
      }
      const newDoc = {};
      const keys = Object.keys(doc);
      for (const k of keys) {
        if (k === "dealInteractions") continue;
        newDoc[k] = doc[k];
        if (k === "spiceLevel" && !Array.isArray(doc.dealInteractions)) {
          newDoc["dealInteractions"] = [];
        }
      }
      if (!("spiceLevel" in doc) && !Array.isArray(doc.dealInteractions)) {
        newDoc["dealInteractions"] = [];
      }
      await col.replaceOne({ _id: doc._id }, newDoc);
      updated++;
    }

    console.log(`✅ Migration complete. Documents updated: ${updated}`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (e) {
    console.error("❌ Migration error:", e);
    process.exit(1);
  }
};

run();
