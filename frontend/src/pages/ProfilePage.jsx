import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/ProfilePage.css";

const ProfilePage = ({ onLogout, darkMode, onToggleTheme }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      console.log("Fetching favorites...");
      const res = await api.get("/api/user/favorites");
      console.log("Favorites data received:", res.data);
      if (Array.isArray(res.data)) {
        setFavorites(res.data);
      } else {
        console.warn("Unexpected data format, expected array:", res.data);
        setFavorites([]);
      }
    } catch (err) {
      console.error("Error fetching favorites:", err.response?.data || err.message);
      alert("Failed to load favorites. Check console for details: " + (err.response?.data?.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (dealId) => {
    try {
      await api.delete(`/api/user/favorites/${dealId}`);
      alert("✅ Removed from favorites!");
      fetchFavorites();
    } catch (err) {
      console.error("Error removing favorite:", err.response?.data || err.message);
      alert("❌ Failed to remove favorite. Check console for details.");
    }
  };

  // Group favorites by restaurant
  const favoritesByRestaurant = favorites.reduce((acc, deal) => {
    const restaurantName = deal.restaurantName || "Unknown Restaurant";
    if (!acc[restaurantName]) {
      acc[restaurantName] = [];
    }
    acc[restaurantName].push(deal);
    return acc;
  }, {});

  return (
    <div className={`profile-container ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Header Section */}
      <header className="home-header">
        <div className="header-top">
          <h1 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "28px", color: "#d70f64" }}>person</span>
            My Profile
          </h1>
          <div className="header-buttons">
            <button 
              className="theme-toggle-btn"
              onClick={onToggleTheme}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "16px" }}>
                {darkMode ? "light_mode" : "dark_mode"}
              </span>
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button className="profile-btn" onClick={() => navigate("/home")} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "16px" }}>home</span>
              Home
            </button>
            <button className="logout-btn" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Profile Stats Section */}
      <div className="profile-stats">
        <div className="stat-card">
          <div className="stat-icon" style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "40px" }}>favorite</div>
          <div className="stat-info">
            <h3>{favorites.length}</h3>
            <p>Favorite Deals</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "40px" }}>restaurant</div>
          <div className="stat-info">
            <h3>{Object.keys(favoritesByRestaurant).length}</h3>
            <p>Restaurants</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "40px" }}>savings</div>
          <div className="stat-info">
            <h3>Rs. {favorites.reduce((total, deal) => total + (deal.price || 0), 0)}</h3>
            <p>Total Saved</p>
          </div>
        </div>
      </div>

      {/* Favorites Section */}
      <main className="main-content">
        <div className="section-header" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "24px", color: "#d70f64" }}>favorite</span>
          <div>
            <h2 style={{ margin: 0 }}>My Favorite Deals</h2>
            <p>All your saved deals in one place</p>
          </div>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading your favorite deals...</p>
          </div>
        ) : favorites.length > 0 ? (
          Object.entries(favoritesByRestaurant).map(([restaurantName, restaurantDeals]) => (
            <div key={restaurantName} className="restaurant-section">
              <div className="restaurant-header" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "20px", color: "#d70f64" }}>restaurant</span>
                <h3 style={{ margin: 0 }}>{restaurantName}</h3>
                <span className="deal-count">{restaurantDeals.length} deals</span>
              </div>
              
              {/* Deals Grid */}
              <div className="deals-grid">
                {restaurantDeals.map((deal) => (
                  <div key={deal._id} className="deal-card">
                    <div className="deal-image-container">
                      <img
                        src={deal.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"}
                        alt={deal.title}
                        className="deal-image"
                      />
                      <div className="deal-badge" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "12px" }}>star</span>
                        Favorite
                      </div>
                      <button 
                        className="remove-favorite-btn"
                        onClick={() => handleRemoveFavorite(deal._id)}
                        title="Remove from favorites"
                        style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "16px" }}
                      >
                        close
                      </button>
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
                            <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "16px", color: "#d70f64" }}>event</span>
                            Valid Till:
                          </span>
                          <span className="detail-value">{new Date(deal.validTill).toLocaleDateString()}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "16px", color: "#d70f64" }}>location_on</span>
                            Location:
                          </span>
                          <span className="detail-value">{deal.city || "N/A"}</span>
                        </div>
                      </div>
                      
                      <div className="deal-actions">
                        <button 
                          className="view-restaurant-btn"
                          onClick={() => navigate("/home")}
                          style={{ display: "flex", alignItems: "center", gap: "6px" }}
                        >
                          <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "16px" }}>restaurant</span>
                          View Restaurant
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="no-favorites">
            <div className="no-favorites-icon" style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "48px", color: "#d70f64" }}>favorite_border</div>
            <h3>No favorites yet</h3>
            <p>Start saving your favorite deals to see them here!</p>
            <button 
              className="explore-btn"
              onClick={() => navigate("/home")}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "16px" }}>explore</span>
              Explore Deals
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProfilePage;

