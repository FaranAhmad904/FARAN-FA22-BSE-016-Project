import Restaurant from "../models/Restaurant.js";
import User from "../models/User.js";
import axios from "axios";

// Get reviews for a deal with user information
export const getDealReviews = async (req, res) => {
  try {
    const { restaurantId, dealId } = req.params;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const deal = restaurant.deals.id(dealId);
    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    // Populate user information for each review
    const reviewsWithUsers = await Promise.all(
      deal.reviews.map(async (review) => {
        const user = await User.findById(review.userId).select("name email");
        return {
          _id: review._id,
          userId: review.userId,
          userName: user ? user.name : "Anonymous",
          userEmail: user ? user.email : "",
          rating: review.rating,
          comment: review.comment,
          sentiment: review.sentiment,
          confidence: review.confidence,
          hybridScore: review.hybridScore,
          createdAt: review.createdAt,
        };
      })
    );

    // Sort by most recent first
    reviewsWithUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      reviews: reviewsWithUsers,
      averageRating:
        reviewsWithUsers.length > 0
          ? (
              reviewsWithUsers.reduce((sum, r) => sum + r.rating, 0) /
              reviewsWithUsers.length
            ).toFixed(1)
          : 0,
      totalReviews: reviewsWithUsers.length,
    });
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ message: "Error fetching reviews: " + err.message });
  }
};

export const addReview = async (req, res) => {
  try {
    const { restaurantId, dealId, rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      const error = new Error("Rating must be between 1 and 5");
      error.statusCode = 400;
      throw error;
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      const error = new Error("Restaurant not found");
      error.statusCode = 404;
      throw error;
    }

    const deal = restaurant.deals.id(dealId);
    if (!deal) {
      const error = new Error("Deal not found");
      error.statusCode = 404;
      throw error;
    }

    let sentimentData = {
      sentiment: "neutral",
      confidence: 0,
      hybridScore: 0
    };

    console.log(`DEBUG: Analyzing review comment: "${comment}"`);
    console.log(`DEBUG: Comment length: ${comment ? comment.length : 0}`);
    console.log(`DEBUG: Comment trimmed: ${comment ? comment.trim() : 'empty'}`);

    // Only analyze if there's a comment
    if (comment && comment.trim()) {
      console.log("DEBUG: Comment exists and is not empty, proceeding with AI service...");
      try {
        console.log("DEBUG: Calling AI service...");
        console.log(`DEBUG: Making request to: http://127.0.0.1:5000/sentiment/analyze`);
        
        const response = await axios.post('http://127.0.0.1:5000/sentiment/analyze', {
          text: comment
        }, {
          timeout: 5000 // 5 second timeout
        });
        
        console.log(`DEBUG: AI service response status: ${response.status}`);
        console.log(`DEBUG: AI service response data:`, response.data);
        
        sentimentData = response.data;
        console.log(`DEBUG: Sentiment analysis result:`, sentimentData);
        
        // Validate the response
        if (!sentimentData || typeof sentimentData !== 'object') {
          console.error("DEBUG: Invalid response from AI service");
          sentimentData = {
            sentiment: "neutral",
            confidence: 0,
            hybridScore: 0
          };
        } else {
          console.log(`DEBUG: Valid sentiment data - Sentiment: ${sentimentData.sentiment}, Confidence: ${sentimentData.confidence}, Hybrid: ${sentimentData.hybridScore}`);
        }
        
      } catch (err) {
        console.error("DEBUG: Sentiment service failed:", err.message);
        console.error("DEBUG: Full error:", err);
        if (err.code === 'ECONNREFUSED') {
          console.error("DEBUG: AI service is not running on localhost:5000");
        } else if (err.code === 'ECONNRESET') {
          console.error("DEBUG: Connection was reset");
        }
        console.log("DEBUG: Using default sentiment values");
      }
    } else {
      console.log("DEBUG: No comment provided or comment is empty, using default sentiment values");
    }

    const newReview = {
      userId: req.user.id,
      rating: rating,
      comment: comment,
      sentiment: sentimentData.sentiment,
      confidence: sentimentData.confidence,
      hybridScore: sentimentData.hybridScore,
      createdAt: new Date()
    };

    deal.reviews.push(newReview);
    await restaurant.save();

    res.json({ success: true, message: "Review added successfully" });
  } catch (err) {
    throw err;
  }
};

export const updateReview = async (req, res) => {
  try {
    const { id } = req.params; // Review ID from the URL
    const { rating, comment } = req.body; // Updated fields

    if (!rating && !comment) {
      const error = new Error("At least one field (rating or comment) is required for update");
      error.statusCode = 400;
      throw error;
    }

    if (rating && (rating < 1 || rating > 5)) {
      const error = new Error("Rating must be between 1 and 5");
      error.statusCode = 400;
      throw error;
    }

    // Find the restaurant and deal containing the review
    const restaurant = await Restaurant.findOne({ "deals.reviews._id": id });
    if (!restaurant) {
      const error = new Error("Review not found");
      error.statusCode = 404;
      throw error;
    }

    // Find the deal and review to update
    const deal = restaurant.deals.find(d => d.reviews.some(r => r._id.toString() === id));
    if (!deal) {
      const error = new Error("Deal not found");
      error.statusCode = 404;
      throw error;
    }

    const review = deal.reviews.id(id);
    if (!review) {
      const error = new Error("Review not found");
      error.statusCode = 404;
      throw error;
    }

    // Update only the provided fields
    if (rating) review.rating = rating;
    if (comment) review.comment = comment;
    review.updatedAt = new Date(); // Optional: Track update time

    await restaurant.save();

    res.json({ success: true, message: "Review updated successfully" });
  } catch (err) {
    throw err;
  }
};