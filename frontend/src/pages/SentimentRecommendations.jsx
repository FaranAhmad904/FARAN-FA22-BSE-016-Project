import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/HomePage.css";

export default function SentimentRecommendations({ darkMode, onToggleTheme }) {
  const [recommendedDeals, setRecommendedDeals] = useState([]);
  const [filteredDeals, setFilteredDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("top-rated");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [priceRange, setPriceRange] = useState("all");
  const [city, setCity] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecommendedDeals();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [recommendedDeals, sortBy, featuredOnly, priceRange, city]);

  const applyFilters = () => {
    let filtered = [...recommendedDeals];
    
    // Apply city filter
    if (city) {
      filtered = filtered.filter(deal => 
        deal.restaurantCity?.toLowerCase() === city.toLowerCase()
      );
    }
    
    // Apply featured filter
    if (featuredOnly) {
      filtered = filtered.filter(deal => deal.featured);
    }
    
    // Apply price range filter
    if (priceRange !== "all") {
      if (priceRange === "low") {
        filtered = filtered.filter(deal => deal.price <= 500);
      } else if (priceRange === "medium") {
        filtered = filtered.filter(deal => deal.price > 500 && deal.price <= 1000);
      } else if (priceRange === "high") {
        filtered = filtered.filter(deal => deal.price > 1000);
      }
    }
    
    // Apply sorting
    if (sortBy === "top-rated") {
      filtered.sort((a, b) => (b.hybridScore || 0) - (a.hybridScore || 0));
    } else if (sortBy === "low-price") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "high-price") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === "most-reviews") {
      filtered.sort((a, b) => (b.reviews?.length || 0) - (a.reviews?.length || 0));
    }
    
    setFilteredDeals(filtered);
  };

  const fetchRecommendedDeals = async () => {
    setLoading(true);
    try {
      console.log('DEBUG: Fetching recommended deals...');
      console.log('DEBUG: Token available:', !!localStorage.getItem("token"));
      
      const res = await axios.get('http://localhost:7000/api/deals/recommended', {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      console.log('DEBUG: API Response status:', res.status);
      console.log('DEBUG: API Response data:', res.data);
      console.log('DEBUG: Data type:', typeof res.data);
      console.log('DEBUG: Data length:', res.data?.length || 0);
      console.log('DEBUG: Is array:', Array.isArray(res.data));
      
      setRecommendedDeals(res.data);
      console.log('DEBUG: State updated with', res.data?.length || 0, 'deals');
      
    } catch (err) {
      console.error('DEBUG: Error fetching recommended deals:', err);
      console.error('DEBUG: Error response:', err.response?.data);
      console.error('DEBUG: Error status:', err.response?.status);
      console.error('DEBUG: Error message:', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        backgroundColor: darkMode ? '#1a1a1a' : '#f8f9fa',
        minHeight: '100vh'
      }}>
        <div className="spinner"></div>
        <p style={{ color: darkMode ? '#ffffff' : '#666' }}>Loading sentiment-based recommendations...</p>
      </div>
    );
  }

  return (
    <div className={`home-container ${darkMode ? "dark-mode" : "light-mode"}`}>
      {/* Top Bar - Exactly like HomePage */}
      <header className="home-header">
        <div className="header-top">
          <h1>🍽 DineMate</h1>
          <div className="header-buttons">
            <button
              className="theme-toggle-btn"
              onClick={onToggleTheme}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontWeight: '600',
                fontSize: '0.875rem',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                padding: '8px 16px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '0.3px'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
            <button 
              className="profile-btn"
              onClick={() => navigate("/")}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontWeight: '600',
                fontSize: '0.875rem',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                padding: '8px 16px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '0.3px'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              🏠 Home
            </button>
            <button 
              className="profile-btn"
              onClick={() => navigate("/profile")}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontWeight: '600',
                fontSize: '0.875rem',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                padding: '8px 16px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '0.3px'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              👤 Profile
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="content-wrapper">
        {/* Left Sidebar - Filters */}
        <aside className="filters-sidebar">
          <div className="filters-header">
            <h3>Filters</h3>
          </div>
          
          <div className="filter-section">
            <h4 className="filter-title">Sort by</h4>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="sort"
                  value="top-rated"
                  checked={sortBy === "top-rated"}
                  onChange={(e) => setSortBy(e.target.value)}
                />
                <span>Top Rated</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="sort"
                  value="low-price"
                  checked={sortBy === "low-price"}
                  onChange={(e) => setSortBy(e.target.value)}
                />
                <span>Low Price</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="sort"
                  value="high-price"
                  checked={sortBy === "high-price"}
                  onChange={(e) => setSortBy(e.target.value)}
                />
                <span>High Price</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="sort"
                  value="most-reviews"
                  checked={sortBy === "most-reviews"}
                  onChange={(e) => setSortBy(e.target.value)}
                />
                <span>Most Reviews</span>
              </label>
            </div>
          </div>

          <div className="filter-section">
            <h4 className="filter-title">City</h4>
            <select 
              className="filter-select"
              onChange={(e) => setCity(e.target.value)} 
              value={city}
            >
              <option value="">All Cities</option>
              <option value="Multan">Multan</option>
              <option value="Lahore">Lahore</option>
              <option value="Sahiwal">Sahiwal</option>
              <option value="Vehari">Vehari</option>
              <option value="Burewala">Burewala</option>
            </select>
          </div>

          <div className="filter-section">
            <h4 className="filter-title">Price Range</h4>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="price"
                  value="all"
                  checked={priceRange === "all"}
                  onChange={(e) => setPriceRange(e.target.value)}
                />
                <span>All Prices</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="price"
                  value="low"
                  checked={priceRange === "low"}
                  onChange={(e) => setPriceRange(e.target.value)}
                />
                <span>Under Rs. 500</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="price"
                  value="medium"
                  checked={priceRange === "medium"}
                  onChange={(e) => setPriceRange(e.target.value)}
                />
                <span>Rs. 500 - 1000</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="price"
                  value="high"
                  checked={priceRange === "high"}
                  onChange={(e) => setPriceRange(e.target.value)}
                />
                <span>Above Rs. 1000</span>
              </label>
            </div>
          </div>

          <div className="filter-section">
            <h4 className="filter-title">Offers</h4>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={featuredOnly}
                  onChange={(e) => setFeaturedOnly(e.target.checked)}
                />
                <span>Featured Deals Only</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
        {/* Simple Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px',
          padding: '20px',
          backgroundColor: darkMode ? '#2d2d2d' : '#ffffff',
          borderRadius: '12px',
          border: `1px solid ${darkMode ? '#404040' : '#e9ecef'}`,
          boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ 
            margin: '0', 
            color: darkMode ? '#ffffff' : '#d70f64',
            fontSize: '1.5rem',
            fontWeight: '600'
          }}>
            Recommended Deals
          </h2>
          <button 
            onClick={fetchRecommendedDeals}
            disabled={loading}
            style={{
              backgroundColor: '#d70f64',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#c9184f';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#d70f64';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "18px" }}>refresh</span>
            Refresh
          </button>
        </div>

      {filteredDeals.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 40px', 
          backgroundColor: darkMode ? '#2d2d2d' : '#f8f9fa', 
          borderRadius: '12px',
          border: `1px solid ${darkMode ? '#404040' : '#e9ecef'}`,
          boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <div style={{ 
            fontFamily: "'Material Icons'", 
            fontStyle: "normal", 
            fontSize: "48px", 
            color: "#d70f64",
            marginBottom: '15px'
          }}>
            sentiment_satisfied
          </div>
          <h3 style={{ color: darkMode ? '#ffffff' : '#666', marginBottom: '10px', fontSize: '1.3rem' }}>
            No Recommended Deals Available
          </h3>
          <p style={{ color: darkMode ? '#b0b0b0' : '#999', fontSize: '1rem', lineHeight: '1.5' }}>
            Deals with positive customer sentiment will appear here once reviews are available.
          </p>
          <p style={{ color: darkMode ? '#b0b0b0' : '#999', fontSize: '0.8rem', marginTop: '10px' }}>
            DEBUG: filteredDeals.length = {filteredDeals.length}
          </p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '20px',
          width: '100%'
        }}>
          {filteredDeals.map((deal, index) => {
            console.log('DEBUG: Rendering deal:', deal.title);
            return (
              <div key={deal._id} style={{
                backgroundColor: darkMode ? '#2d2d2d' : 'white',
                borderRadius: '16px',
                border: `1px solid ${darkMode ? '#404040' : '#e9ecef'}`,
                boxShadow: darkMode ? '0 6px 12px rgba(0,0,0,0.3)' : '0 6px 12px rgba(0,0,0,0.08)',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                width: '100%'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = darkMode ? '0 8px 20px rgba(0,0,0,0.4)' : '0 8px 20px rgba(0,0,0,0.12)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = darkMode ? '0 6px 12px rgba(0,0,0,0.3)' : '0 6px 12px rgba(0,0,0,0.08)';
              }}
              onClick={() => navigate(`/restaurant/${deal.restaurantId}/deal/${deal._id}`)}
              >
                {/* Deal Image */}
                <div style={{
                  position: 'relative',
                  height: '180px',
                  backgroundColor: darkMode ? '#1a1a1a' : '#f8f9fa',
                  overflow: 'hidden'
                }}>
                  <img 
                    src={deal.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"}
                    alt={deal.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80";
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    backgroundColor: '#d70f64',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}>
                    <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "12px" }}>star</span>
                    Recommended
                  </div>
                </div>

                {/* Deal Content */}
                <div style={{ padding: '15px' }}>
                  {/* Restaurant Info */}
                  <div style={{ marginBottom: '12px' }}>
                    <h3 style={{
                      margin: '0 0 6px 0',
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      color: darkMode ? '#ffffff' : '#1a1a1a',
                      lineHeight: '1.2'
                    }}>
                      {deal.title.length > 25 ? deal.title.substring(0, 25) + "..." : deal.title}
                    </h3>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '6px',
                      color: darkMode ? '#b0b0b0' : '#666',
                      fontSize: '0.85rem'
                    }}>
                      <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "14px", color: "#d70f64" }}>location_on</span>
                      <span>{deal.restaurantName?.length > 15 ? deal.restaurantName.substring(0, 15) + "..." : deal.restaurantName}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      color: '#d70f64'
                    }}>
                      <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "16px", color: "#d70f64" }}>payments</span>
                      <span>Rs. {deal.price}</span>
                    </div>
                    {deal.description && (
                      <p style={{
                        margin: '8px 0 0 0',
                        fontSize: '0.8rem',
                        color: darkMode ? '#b0b0b0' : '#666',
                        lineHeight: '1.4'
                      }}>
                        {deal.description.length > 60 ? deal.description.substring(0, 60) + "..." : deal.description}
                      </p>
                    )}
                  </div>

                  {/* ML Score Display */}
                  <div style={{
                    backgroundColor: darkMode ? '#1a3a1a' : '#e8f5e8',
                    border: `1px solid ${darkMode ? '#2d5a2d' : '#c3e6cb'}`,
                    borderRadius: '8px',
                    padding: '10px',
                    marginBottom: '12px'
                  }}>
                    <h4 style={{
                      margin: '0 0 8px 0',
                      color: darkMode ? '#4caf50' : '#155724',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "14px", color: darkMode ? '#4caf50' : '#155724' }}>analytics</span>
                      ML Analysis
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: '0', fontSize: '0.75rem', color: darkMode ? '#b0b0b0' : '#666', fontWeight: '500' }}>
                          Score
                        </p>
                        <p style={{
                          margin: '2px 0 0 0',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          color: darkMode ? '#4caf50' : '#155724'
                        }}>
                          {deal.hybridScore?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: '0', fontSize: '0.75rem', color: darkMode ? '#b0b0b0' : '#666', fontWeight: '500' }}>
                          Reviews
                        </p>
                        <p style={{
                          margin: '2px 0 0 0',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          color: darkMode ? '#4caf50' : '#155724'
                        }}>
                          {deal.reviews?.filter(r => r.sentiment === "positive" || r.sentiment === "neutral").length || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Reviews Summary */}
                  {deal.reviews && deal.reviews.length > 0 && (
                    <div style={{
                      backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
                      borderRadius: '8px',
                      padding: '8px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                        <span style={{ color: '#28a745', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "12px" }}>sentiment_very_satisfied</span>
                          {deal.reviews.filter(r => r.sentiment === "positive").length}
                        </span>
                        <span style={{ color: '#ffc107', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "12px" }}>sentiment_neutral</span>
                          {deal.reviews.filter(r => r.sentiment === "neutral").length}
                        </span>
                        <span style={{ color: '#dc3545', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "12px" }}>sentiment_very_dissatisfied</span>
                          {deal.reviews.filter(r => r.sentiment === "negative").length}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/restaurant/${deal.restaurantId}/deal/${deal._id}`);
                    }}
                    style={{
                      backgroundColor: '#d70f64',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      width: '100%',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = '#c9184f';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = '#d70f64';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "14px" }}>visibility</span>
                    View Deal
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </main>
      </div>
    </div>
  );
};
