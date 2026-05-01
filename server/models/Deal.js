import mongoose from "mongoose";

const dealSchema = new mongoose.Schema({
  city: String,
  restaurant: String,
  cuisine: String,
  dealTitle: String,
  price: Number,
  timing: String,
  image: String, // ✅ image URL
});

export default mongoose.model("Deal", dealSchema);