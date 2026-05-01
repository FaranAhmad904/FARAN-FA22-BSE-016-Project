import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
  dealId: { type: mongoose.Schema.Types.ObjectId, required: true }
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    role: { 
      type: String, 
      enum: ['customer', 'restaurantManager', 'admin'], 
      default: 'customer' 
    },
    favorites: [favoriteSchema]
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;