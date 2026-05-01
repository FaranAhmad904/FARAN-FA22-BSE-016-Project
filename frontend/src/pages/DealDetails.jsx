import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import { IMAGE_BASE_URL } from "../config/api";
import "../styles/HomePage.css";

const DealDetails = ({ onLogout, darkMode, onToggleTheme }) => {
  const { restaurantId, dealId } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReviews, setShowReviews] = useState(false);
  const [dealReviews, setDealReviews] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: "", comment: "" });
  const navigate = useNavigate();

  useEffect(() => {
    fetchDealDetails();
  }, [restaurantId, dealId]);
  
  useEffect(() => {
    const recordView = async () => {
      try {
        await api.post(
          "/api/analytics/view",
          { restaurantId, dealId }
        );
      } catch (err) {}
    };
    if (restaurantId && dealId) recordView();
  }, [restaurantId, dealId]);

  const fetchDealDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/restaurants");
      const foundRestaurant = res.data.find(r => r._id === restaurantId);
      if (foundRestaurant) {
        setRestaurant(foundRestaurant);
        const foundDeal = foundRestaurant.deals?.find(d => d._id === dealId);
        if (foundDeal) {
          setDeal(foundDeal);
        } else {
          alert("Deal not found");
          navigate(`/restaurant/${restaurantId}`);
        }
      } else {
        alert("Restaurant not found");
        navigate("/home");
      }
    } catch (err) {
      console.error("Error fetching deal details:", err);
      alert("Failed to load deal details");
      navigate("/home");
    } finally {
      setLoading(false);
    }
  };

  const fetchDealReviews = async () => {
    setLoadingReviews(true);
    try {
      const res = await api.get(
        `/api/user/reviews/restaurant/${restaurantId}/deal/${dealId}`
      );
      setDealReviews(res.data);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setDealReviews({ reviews: [], averageRating: 0, totalReviews: 0 });
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleViewReviews = () => {
    setShowReviews(!showReviews);
    if (!showReviews && !dealReviews) {
      fetchDealReviews();
    }
  };

  const handleReviewSubmit = async () => {
    const { rating, comment } = reviewData;
    if (!rating) return alert("Please select a rating");

    try {
      await api.post(
        "/api/user/reviews",
        { restaurantId, dealId, rating: parseInt(rating), comment }
      );
      alert("✅ Review submitted!");
      setReviewData({ rating: "", comment: "" });
      await fetchDealReviews();
      fetchDealDetails(); // Refresh deal data
    } catch (err) {
      console.error("Error submitting review:", err.response?.data || err.message);
      alert("❌ Failed to submit review. Check console for details.");
    }
  };

  const handleAddFavorite = async () => {
    try {
      await api.post(
        "/api/user/favorites",
        { restaurantId, dealId }
      );
      alert("✅ Added to favorites!");
    } catch (err) {
      console.error("Error adding favorite:", err.response?.data || err.message);
      alert("❌ Failed to add to favorites.");
    }
  };

  if (loading) {
    return (
      <div className={`home-container ${darkMode ? "dark-mode" : "light-mode"}`}>
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading deal details...</p>
        </div>
      </div>
    );
  }

  if (!deal || !restaurant) {
    return (
      <div className={`home-container ${darkMode ? "dark-mode" : "light-mode"}`}>
        <div className="no-deals">
          <h3>Deal not found</h3>
        </div>
      </div>
    );
  }

  const avgRating = deal.reviews?.length > 0
    ? (deal.reviews.reduce((a, r) => a + r.rating, 0) / deal.reviews.length).toFixed(1)
    : "No ratings";

  return (
    <div className={`home-container ${darkMode ? "dark-mode" : "light-mode"}`}>
      <header className="home-header">
        <div className="header-top">
          <h1>🍽 DineMate</h1>
          <div className="header-buttons">
            <button
              className="theme-toggle-btn"
              onClick={onToggleTheme}
            >
              {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
            <button className="profile-btn" onClick={() => navigate("/profile")}>
              👤 Profile
            </button>
            <button className="logout-btn" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="main-content" style={{ padding: "24px 32px", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Breadcrumbs */}
        <div style={{ marginBottom: "20px", color: darkMode ? "#b0b0b0" : "#666666" }}>
          <button
            onClick={() => navigate("/home")}
            style={{
              background: "none",
              border: "none",
              color: "#d70f64",
              cursor: "pointer",
              textDecoration: "underline",
              padding: 0,
              marginRight: "8px"
            }}
          >
            Home
          </button>
          <span> / </span>
          <button
            onClick={() => navigate(`/restaurant/${restaurantId}`)}
            style={{
              background: "none",
              border: "none",
              color: "#d70f64",
              cursor: "pointer",
              textDecoration: "underline",
              padding: 0,
              margin: "0 8px"
            }}
          >
            {restaurant.name}
          </button>
          <span> / </span>
          <span style={{ marginLeft: "8px" }}>{deal.title}</span>
        </div>

        {/* Deal Details Card */}
        <div className="restaurant-card" style={{ marginBottom: "32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", alignItems: "start" }}>
            {/* Left: Image */}
            <div>
              <div className="deal-detail-image-container">
                <img
                  src={
                    (() => {
                      const imageUrl = deal.image ? 
                        (deal.image.startsWith('http') ? deal.image : 
                          (deal.image.startsWith('/') ? `${IMAGE_BASE_URL}${deal.image}` : `${IMAGE_BASE_URL}/${deal.image}`)) : 
                        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=85";
                      console.log('DEBUG DealDetails Image:', {
                        dealImage: deal.image,
                        IMAGE_BASE_URL,
                        finalUrl: imageUrl
                      });
                      return imageUrl;
                    })()
                  }
                  alt={deal.title}
                  className="deal-detail-image"
                  loading="eager"
                  decoding="async"
                  onError={(e) => {
                    console.error('DealDetails image failed to load:', e.target.src);
                    e.target.src = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=85";
                  }}
                />
                {deal.dealType ? (
                  <div className="deal-badge">{deal.dealType.charAt(0).toUpperCase() + deal.dealType.slice(1)}</div>
                ) : deal.featured && (
                  <div className="deal-badge featured-badge">Featured</div>
                )}
              </div>
            </div>

            {/* Right: Details */}
            <div>
              <h2 style={{ 
                color: darkMode ? "#ffffff" : "#1a1a1a", 
                fontFamily: "'Poppins', sans-serif", 
                fontSize: "2rem", 
                fontWeight: 700,
                marginBottom: "16px"
              }}>
                {deal.title}
              </h2>

              <p style={{ 
                color: darkMode ? "#b0b0b0" : "#666666", 
                fontSize: "1rem", 
                lineHeight: "1.6",
                marginBottom: "24px"
              }}>
                {deal.description || "No description available."}
              </p>

              <div className="deal-details" style={{ marginBottom: "24px" }}>
                <div className="detail-item">
                  <span className="detail-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "16px", color: "#d70f64" }}>payments</span>
                    Price:
                  </span>
                  <span className="detail-value" style={{ fontSize: "1.25rem", fontWeight: 700, color: "#d70f64" }}>
                    Rs. {deal.price}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "16px", color: "#d70f64" }}>star</span>
                    Rating:
                  </span>
                  <span className="detail-value" style={{ fontSize: "1.1rem", fontWeight: 600 }}>
                    {avgRating} / 5 ({deal.reviews?.length || 0} reviews)
                  </span>
                </div>
                {deal.validTill && (
                  <div className="detail-item">
                    <span className="detail-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "16px", color: "#d70f64" }}>event</span>
                      Valid Till:
                    </span>
                    <span className="detail-value">{new Date(deal.validTill).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="detail-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "16px", color: "#d70f64" }}>restaurant</span>
                    Restaurant:
                  </span>
                  <span className="detail-value">{restaurant.name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "16px", color: "#d70f64" }}>location_on</span>
                    Location:
                  </span>
                  <span className="detail-value">{restaurant.city}</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button
                  onClick={handleViewReviews}
                  style={{
                    padding: "12px 24px",
                    background: "#3498db",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "16px" }}>
                    {showReviews ? "visibility_off" : "rate_review"}
                  </span>
                  {showReviews ? "Hide Reviews" : "View Reviews"}
                </button>
                <button
                  onClick={handleAddFavorite}
                  style={{
                    padding: "12px 24px",
                    background: "rgba(215, 15, 100, 0.1)",
                    color: "#d70f64",
                    border: "2px solid #d70f64",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "16px" }}>favorite_border</span>
                  Add to Favorites
                </button>
                <button
                  onClick={() => navigate(`/restaurant/${restaurantId}`)}
                  style={{
                    padding: "12px 24px",
                    background: "rgba(215, 15, 100, 0.1)",
                    color: "#d70f64",
                    border: "2px solid #d70f64",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.95rem"
                  }}
                >
                  ← Back to Restaurant
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        {showReviews && (
          <div className="restaurant-card">
            <h3 style={{ 
              color: darkMode ? "#ffffff" : "#1a1a1a", 
              fontFamily: "'Poppins', sans-serif", 
              fontSize: "1.5rem", 
              fontWeight: 700,
              marginBottom: "20px"
            }}>
              Customer Reviews
            </h3>

            {loadingReviews ? (
              <div className="loading-reviews">Loading reviews...</div>
            ) : (
              <>
                {dealReviews?.reviews?.length > 0 ? (
                  <div className="reviews-list">
                    {dealReviews.reviews.map((review) => (
                      <div key={review._id} className="review-item">
                        <div className="review-header">
                          <div className="reviewer-info">
                            <span className="reviewer-name">{review.userName}</span>
                            <span className="review-date">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="review-rating">
                            {"⭐".repeat(review.rating)}
                            <span className="rating-number">({review.rating}/5)</span>
                          </div>
                        </div>
                        {review.comment && (
                          <div className="review-comment">
                            <p>"{review.comment}"</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-reviews">No reviews yet. Be the first to review!</div>
                )}
              </>
            )}
          </div>
        )}

        {/* Write Review Section */}
        <div className="restaurant-card">
          <h3 style={{ 
            color: darkMode ? "#ffffff" : "#1a1a1a", 
            fontFamily: "'Poppins', sans-serif", 
            fontSize: "1.5rem", 
            fontWeight: 700,
            marginBottom: "20px"
          }}>
            Write a Review
          </h3>

          <div className="review-section">
            <div className="review-form">
              <input
                type="number"
                min="1"
                max="5"
                placeholder="Rating (1-5)"
                value={reviewData.rating}
                onChange={(e) => setReviewData({ ...reviewData, rating: e.target.value })}
              />
              <input
                type="text"
                placeholder="Your comment..."
                value={reviewData.comment}
                onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
              />
              <button
                className="review-btn"
                onClick={handleReviewSubmit}
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DealDetails;

