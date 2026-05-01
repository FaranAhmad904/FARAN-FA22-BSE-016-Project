import mongoose from "mongoose";

/**
 * UserPreference Schema
 * 
 * Stores user food preferences separately from User collection
 * This follows best practices by keeping preferences in a separate collection
 * to avoid modifying the existing User schema.
 * 
 * Fields:
 * - userId: Reference to User collection
 * - cuisine: Array of preferred cuisines (e.g., ["Pakistani", "BBQ", "Chinese"])
 * - spiceLevel: Preferred spice level (1-5 scale)
 * - budget: Budget range (low, medium, high)
 * - dietary: Dietary restrictions/preferences (e.g., "vegetarian", "halal", "none")
 * - city: Preferred city for dining
 * - updatedAt: Timestamp of last update (auto-managed)
 */
const userPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true // One preference record per user (unique creates an index automatically)
    },
    cuisine: {
      type: [String],
      default: [],
      validate: {
        validator: function(v) {
          // Valid cuisine types
          const validCuisines = ["Pakistani", "BBQ", "Chinese", "Fast Food", "Italian", "Thai", "Indian"];
          return v.every(cuisine => validCuisines.includes(cuisine));
        },
        message: "Invalid cuisine type"
      }
    },
    spiceLevel: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
      validate: {
        validator: Number.isInteger,
        message: "Spice level must be an integer between 1 and 5"
      }
    },
    dealInteractions: {
      type: [
        {
          deal_id: { type: mongoose.Schema.Types.Mixed, required: true },
          dealPrice: { type: Number, required: true },
          actions: {
            view: { type: Number, default: 0 },
            click: { type: Number, default: 0 },
            save: { type: Number, default: 0 }
          },
          lastInteractionAt: { type: Date, required: true }
        }
      ],
      default: []
    },
    engagementScore: {
      type: Number,
      default: 0,
      min: 0
    },
    budget: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },
    dietary: {
      type: String,
      enum: ["none", "vegetarian", "halal", "vegan"],
      default: "none"
    },
    city: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    versionKey: false
  }
);

const UserPreference = mongoose.model("UserPreference", userPreferenceSchema);
export default UserPreference;
