// server/controllers/preferenceController.js
import UserPreference from "../models/UserPreference.js";

/**
 * Save or Update User Preferences
 * 
 * This endpoint handles both creation and update of user preferences.
 * If preferences exist for the user, they are updated.
 * If not, new preferences are created.
 * 
 * Request Body:
 * - cuisine: Array of strings
 * - spiceLevel: Number (1-5)
 * - budget: String ("low", "medium", "high")
 * - dietary: String ("none", "vegetarian", "halal", "vegan")
 * - city: String
 */
export const savePreferences = async (req, res) => {
  try {
    const userId = req.user.id; // From JWT token
    const { cuisine, spiceLevel, budget, dietary, city } = req.body;

    // Validate required fields
    if (!cuisine || !Array.isArray(cuisine) || cuisine.length === 0) {
      return res.status(400).json({ 
        message: "Cuisine preferences are required and must be a non-empty array" 
      });
    }

    if (spiceLevel !== undefined && (spiceLevel < 1 || spiceLevel > 5)) {
      return res.status(400).json({ 
        message: "Spice level must be between 1 and 5" 
      });
    }

    // Use findOneAndUpdate with upsert to create or update
    const preferences = await UserPreference.findOneAndUpdate(
      { userId },
      {
        $set: {
          cuisine: cuisine || [],
          spiceLevel: spiceLevel || 3,
          budget: budget || "medium",
          dietary: dietary || "none",
          city: city || ""
        },
        $setOnInsert: {
          userId,
          dealInteractions: []
        }
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: "Preferences saved successfully",
      preferences
    });
  } catch (err) {
    console.error("Error saving preferences:", err);
    res.status(500).json({ 
      message: "Failed to save preferences: " + err.message 
    });
  }
};

/**
 * Get User Preferences
 * 
 * Retrieves the current preferences for the authenticated user.
 * Returns default values if no preferences exist.
 */
export const getPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    let preferences = await UserPreference.findOne({ userId });

    // If no preferences exist, return defaults
    if (!preferences) {
      preferences = {
        userId,
        cuisine: [],
        spiceLevel: 3,
        budget: "medium",
        dietary: "none",
        city: ""
      };
    }

    res.status(200).json({
      success: true,
      preferences
    });
  } catch (err) {
    console.error("Error fetching preferences:", err);
    res.status(500).json({ 
      message: "Failed to fetch preferences: " + err.message 
    });
  }
};

