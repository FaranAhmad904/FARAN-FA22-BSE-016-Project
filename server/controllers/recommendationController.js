// server/controllers/recommendationController.js
import UserPreference from "../models/UserPreference.js";
import Restaurant from "../models/Restaurant.js";
import axios from "axios";

/**
 * AI Recommendation Endpoint
 * 
 * This endpoint:
 * 1. Fetches user preferences from UserPreference collection
 * 2. Fetches all restaurants from MongoDB
 * 3. Sends both to Python AI service for content-based filtering
 * 4. Returns ranked recommendations with match scores and explanations
 * 
 * Algorithm: Content-based filtering
 * - Converts user preferences into a preference vector
 * - Scores each restaurant using weighted feature similarity
 * - Returns top 5 recommendations
 */
export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Step 1: Fetch user preferences
    let preferences = await UserPreference.findOne({ userId });

    // If no preferences exist, return error asking user to set preferences first
    if (!preferences) {
      return res.status(400).json({
        success: false,
        message: "Please set your preferences first to get AI recommendations"
      });
    }

    // Step 2: Prepare data for Python AI service
    // Python service will now fetch data directly from MongoDB to ensure fresh data
    const requestData = {
      preferences: {
        cuisine: preferences.cuisine || [],
        spiceLevel: preferences.spiceLevel || 3,
        budget: preferences.budget || "medium",
        dietary: preferences.dietary || "none",
        city: preferences.city || ""
      },
      userId: userId  // Pass userId so Python can fetch preferences if needed
    };

    console.log(`[AI Recommendations] Requesting recommendations from Python AI service (will fetch fresh data from MongoDB)`);

    // Step 3: Call Python AI service (it will fetch data directly from MongoDB)
    try {
      // Use 127.0.0.1 instead of localhost to avoid IPv6 connection issues on Windows
      const pythonServiceUrl = process.env.PYTHON_AI_SERVICE_URL || "http://127.0.0.1:5000";
      const response = await axios.post(
        `${pythonServiceUrl}/api/recommend`,
        requestData,
        {
          timeout: 30000, // 30 second timeout (MongoDB fetch may take longer)
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Step 5: Return recommendations
      res.status(200).json({
        success: true,
        recommendations: response.data.recommendations,
        preferences: preferences
      });
    } catch (pythonError) {
      console.error("Python AI service error:", pythonError.message);
      if (pythonError.response && pythonError.response.data) {
        console.error("Python AI service error details:", JSON.stringify(pythonError.response.data, null, 2));
      }
      
      // Fallback: Return error with helpful message
      res.status(503).json({
        success: false,
        message: "AI recommendation service is currently unavailable. Please try again later.",
        error: pythonError.message
      });
    }
  } catch (err) {
    console.error("Error getting recommendations:", err);
    res.status(500).json({
      success: false,
      message: "Failed to get recommendations: " + err.message
    });
  }
};

