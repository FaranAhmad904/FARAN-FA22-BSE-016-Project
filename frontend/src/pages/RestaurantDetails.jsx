import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IMAGE_BASE_URL } from "../config/api";
import api from "../api";
import "../styles/HomePage.css";

const RestaurantDetails = ({ onLogout, darkMode, onToggleTheme }) => {
  const { restaurantId } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nowTick, setNowTick] = useState(Date.now());
  const [activeFilter, setActiveFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    fetchRestaurant();
  }, [restaurantId]);

  useEffect(() => {
    const recordView = async () => {
      try {
        await api.post(
        "/api/analytics/view",
          { restaurantId },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
      } catch (err) {}
    };
    if (restaurantId) recordView();
  }, [restaurantId]);
  
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchRestaurant = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/restaurants");
      const foundRestaurant = res.data.find(r => r._id === restaurantId);
      if (foundRestaurant) {
        setRestaurant(foundRestaurant);
      } else {
        alert("Restaurant not found");
        navigate("/home");
      }
    } catch (err) {
      console.error("Error fetching restaurant:", err);
      alert("Failed to load restaurant details");
      navigate("/home");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`home-container ${darkMode ? "dark-mode" : "light-mode"}`}>
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading restaurant details...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className={`home-container ${darkMode ? "dark-mode" : "light-mode"}`}>
        <div className="no-deals">
          <h3>Restaurant not found</h3>
        </div>
      </div>
    );
  }

  const avgRating = restaurant.deals?.length > 0
    ? restaurant.deals.reduce((sum, deal) => {
        const dealRating = deal.reviews?.length > 0
          ? deal.reviews.reduce((a, r) => a + r.rating, 0) / deal.reviews.length
          : 0;
        return sum + dealRating;
      }, 0) / restaurant.deals.length
    : 0;

  const totalReviews = restaurant.deals?.reduce((sum, deal) => sum + (deal.reviews?.length || 0), 0) || 0;

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

      <main className="main-content" style={{ padding: "24px 32px", maxWidth: "1400px", margin: "0 auto" }}>
        {/* Restaurant Info */}
        <div className="restaurant-details-header" style={{ 
          background: darkMode ? "#2d2d2d" : "#ffffff", 
          borderRadius: "12px", 
          padding: "24px", 
          marginBottom: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          border: `1px solid ${darkMode ? "#404040" : "#f0f0f0"}`
        }}>
          <div className="restaurant-title-row" style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "flex-start", 
            marginBottom: "16px",
            flexWrap: "wrap",
            gap: "12px"
          }}>
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", flex: 1 }}>
              {restaurant.image && (
                <div style={{ 
                  width: "120px", 
                  height: "120px", 
                  borderRadius: "8px", 
                  overflow: "hidden",
                  flexShrink: 0
                }}>
                  <img 
                    src={restaurant.image.startsWith('http') ? restaurant.image : `${IMAGE_BASE_URL}${restaurant.image}`} 
                    alt={restaurant.name}
                    style={{ 
                      width: "100%", 
                      height: "100%", 
                      objectFit: "cover"
                    }}
                  />
                </div>
              )}
              
              <div style={{ flex: 1, minWidth: "0" }}>
                <h3 style={{ 
                  color: darkMode ? "#ffffff" : "#1a1a1a", 
                  fontSize: "2rem", 
                  fontWeight: "700", 
                  margin: "0 0 12px 0",
                  fontFamily: "'Poppins', sans-serif"
                }}>
                  {restaurant.name}
                </h3>
                
                <div className="restaurant-info" style={{ 
                  display: "flex", 
                  flexWrap: "wrap", 
                  gap: "16px", 
                  alignItems: "center"
                }}>
                  <span className="location" style={{ 
                    color: darkMode ? "#b0b0b0" : "#6c757d", 
                    fontSize: "1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    <span className="location-icon" style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "16px", color: "#d70f64" }}>location_on</span>
                    {restaurant.city}
                  </span>
                  <span className="cuisine" style={{ 
                    color: darkMode ? "#b0b0b0" : "#6c757d", 
                    fontSize: "1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    <span className="cuisine-icon" style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "16px", color: "#d70f64" }}>restaurant_menu</span>
                    {restaurant.cuisine}
                  </span>
                  <span style={{ 
                    color: darkMode ? "#b0b0b0" : "#6c757d", 
                    fontSize: "1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    <span className="rating-icon" style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "16px", color: "#d70f64" }}>star</span>
                    {avgRating.toFixed(1)}/5 ({totalReviews} reviews)
                  </span>
                </div>
              </div>
            </div>
            
            {restaurant.featured && (
              <span className="restaurant-featured-badge" style={{
                background: "linear-gradient(135deg, #d70f64 0%, #ff006e 100%)",
                color: "white",
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "0.875rem",
                fontWeight: "600",
                whiteSpace: "nowrap",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "16px" }}>star</span>
                Featured Restaurant
              </span>
            )}
          </div>
          
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            marginTop: "16px"
          }}>
            <div></div>
            {restaurant.latitude && restaurant.longitude && (
              <button 
                className="see-location-btn"
                onClick={() => {
                  window.open(`https://www.google.com/maps/search/?api=1&query=${restaurant.latitude},${restaurant.longitude}`, '_blank');
                }}
                style={{
                  padding: "8px 16px",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  backgroundColor: "#4285F4",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: "500",
                  transition: "all 0.2s ease"
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = "#3367d6"}
                onMouseOut={(e) => e.target.style.backgroundColor = "#4285F4"}
              >
                <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "16px" }}>map</span>
                See Location
              </button>
            )}
          </div>
        </div>

        {/* Deal Filters */}
        <div className="deal-filters" style={{ 
          marginBottom: "24px",
          padding: "16px",
          background: darkMode ? "#2d2d2d" : "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          border: `1px solid ${darkMode ? "#404040" : "#f0f0f0"}`
        }}>
          <div className="filter-nav" style={{ 
            display: "flex", 
            flexWrap: "wrap", 
            gap: "12px", 
            alignItems: "center",
            justifyContent: "flex-start"
          }}>
            <button
              className={`filter-btn ${activeFilter === "all" ? "active" : ""}`}
              onClick={() => setActiveFilter("all")}
              style={{
                padding: "8px 16px",
                background: activeFilter === "all" ? "#d70f64" : "transparent",
                color: activeFilter === "all" ? "#ffffff" : darkMode ? "#b0b0b0" : "#6c757d",
                border: `1px solid ${activeFilter === "all" ? "#d70f64" : darkMode ? "#404040" : "#e0e0e0"}`,
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "0.9rem",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s ease"
              }}
            >
              <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "16px" }}>apps</span>
              All Deals
            </button>
            <button
              className={`filter-btn ${activeFilter === "topRated" ? "active" : ""}`}
              onClick={() => setActiveFilter("topRated")}
              style={{
                padding: "8px 16px",
                background: activeFilter === "topRated" ? "#d70f64" : "transparent",
                color: activeFilter === "topRated" ? "#ffffff" : darkMode ? "#b0b0b0" : "#6c757d",
                border: `1px solid ${activeFilter === "topRated" ? "#d70f64" : darkMode ? "#404040" : "#e0e0e0"}`,
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "0.9rem",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s ease"
              }}
            >
              <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "16px" }}>star</span>
              Top Rated
            </button>
            <button
              className={`filter-btn ${activeFilter === "lowPrice" ? "active" : ""}`}
              onClick={() => setActiveFilter("lowPrice")}
              style={{
                padding: "8px 16px",
                background: activeFilter === "lowPrice" ? "#d70f64" : "transparent",
                color: activeFilter === "lowPrice" ? "#ffffff" : darkMode ? "#b0b0b0" : "#6c757d",
                border: `1px solid ${activeFilter === "lowPrice" ? "#d70f64" : darkMode ? "#404040" : "#e0e0e0"}`,
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "0.9rem",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s ease"
              }}
            >
              <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "16px" }}>trending_down</span>
              Low Price
            </button>
            <button
              className={`filter-btn ${activeFilter === "highPrice" ? "active" : ""}`}
              onClick={() => setActiveFilter("highPrice")}
              style={{
                padding: "8px 16px",
                background: activeFilter === "highPrice" ? "#d70f64" : "transparent",
                color: activeFilter === "highPrice" ? "#ffffff" : darkMode ? "#b0b0b0" : "#6c757d",
                border: `1px solid ${activeFilter === "highPrice" ? "#d70f64" : darkMode ? "#404040" : "#e0e0e0"}`,
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "0.9rem",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s ease"
              }}
            >
              <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "16px" }}>trending_up</span>
              High Price
            </button>
            <button
              className={`filter-btn ${activeFilter === "featured" ? "active" : ""}`}
              onClick={() => setActiveFilter("featured")}
              style={{
                padding: "8px 16px",
                background: activeFilter === "featured" ? "#d70f64" : "transparent",
                color: activeFilter === "featured" ? "#ffffff" : darkMode ? "#b0b0b0" : "#6c757d",
                border: `1px solid ${activeFilter === "featured" ? "#d70f64" : darkMode ? "#404040" : "#e0e0e0"}`,
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "0.9rem",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s ease"
              }}
            >
              <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "16px" }}>star</span>
                Featured
              </button>
          </div>
        </div>

        {/* Available Deals Section */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ color: darkMode ? "#ffffff" : "#1a1a1a", fontFamily: "'Poppins', sans-serif", fontSize: "1.75rem", fontWeight: 700 }}>
              Available Deals
            </h2>
            <button
              onClick={() => navigate("/home")}
              style={{
                padding: "8px 16px",
                background: "#d70f64",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "16px" }}>home</span>
              Back to Home
            </button>
          </div>

          {restaurant.deals && restaurant.deals.length > 0 ? (() => {
            // Apply filters
            let filteredDeals = [...restaurant.deals];
            
            switch (activeFilter) {
              case "topRated":
                filteredDeals = filteredDeals
                  .filter(deal => deal.reviews && deal.reviews.length > 0)
                  .sort((a, b) => {
                    const avgA = a.reviews.reduce((sum, r) => sum + r.rating, 0) / a.reviews.length;
                    const avgB = b.reviews.reduce((sum, r) => sum + r.rating, 0) / b.reviews.length;
                    return avgB - avgA;
                  });
                break;
              case "lowPrice":
                filteredDeals = filteredDeals.sort((a, b) => a.price - b.price);
                break;
              case "highPrice":
                filteredDeals = filteredDeals.sort((a, b) => b.price - a.price);
                break;
              case "featured":
                filteredDeals = filteredDeals.filter(deal => deal.featured);
                break;
              default:
                // "all" - no filtering
                break;
            }

            return (
              <div className="deal-row">
                {filteredDeals.map((deal) => {
                const dealRating = deal.reviews?.length > 0
                  ? (deal.reviews.reduce((a, r) => a + r.rating, 0) / deal.reviews.length).toFixed(1)
                  : "No ratings";
                const remainingMs = deal.endTime ? new Date(deal.endTime).getTime() - nowTick : null;
                const remainingStr = remainingMs && remainingMs > 0
                  ? (() => {
                      const s = Math.floor(remainingMs / 1000);
                      const d = Math.floor(s / 86400);
                      const h = Math.floor((s % 86400) / 3600);
                      const m = Math.floor((s % 3600) / 60);
                      const sec = s % 60;
                      return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${sec}s`;
                    })()
                  : null;

                return (
                  <div
                    key={deal._id}
                    className="deal-card"
                    onClick={async () => {
                      try {
                        await api.post(
                          "/api/analytics/click",
                          { restaurantId, dealId: deal._id },
                          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
                        );
                      } catch (err) {}
                      navigate(`/restaurant/${restaurantId}/deal/${deal._id}`);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="deal-image-container">
                      <img
                        src={deal.image ? (deal.image.startsWith('http') ? deal.image : `${IMAGE_BASE_URL}${deal.image}`) : "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"}
                        alt={deal.title}
                        className="deal-image"
                      />
                      {deal.dealType ? (
                        <div className="deal-badge">{deal.dealType.charAt(0).toUpperCase() + deal.dealType.slice(1)}</div>
                      ) : deal.featured ? (
                        <div className="deal-badge featured-badge">Featured</div>
                      ) : (
                        <div className="deal-badge">Deal</div>
                      )}
                    </div>

                    <div className="deal-content">
                      <h4>{deal.title}</h4>
                      <p className="deal-description">{deal.description}</p>

                      <div className="deal-details">
                        <div className="detail-item">
                          <span className="detail-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "16px", color: "#d70f64" }}>payments</span>
                            Price:
                          </span>
                          <span className="detail-value">Rs. {deal.price}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "16px", color: "#d70f64" }}>star</span>
                            Rating:
                          </span>
                          <span className="detail-value">{dealRating} ({deal.reviews?.length || 0} reviews)</span>
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
                        {remainingStr && (
                          <div className="detail-item">
                            <span className="detail-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "16px", color: "#d70f64" }}>timer</span>
                              Ends In:
                            </span>
                            <span className="detail-value">{remainingStr}</span>
                          </div>
                        )}
                      </div>

                      <button
                        className="favorite-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          (async () => {
                            try {
                              await api.post(
                                "/api/analytics/click",
                                { restaurantId, dealId: deal._id }
                              );
                            } catch (err) {}
                            navigate(`/restaurant/${restaurantId}/deal/${deal._id}`);
                          })();
                        }}
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            );
          })() : (
            <div className="no-deals-message">
              <p>No deals available at this restaurant yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default RestaurantDetails;

