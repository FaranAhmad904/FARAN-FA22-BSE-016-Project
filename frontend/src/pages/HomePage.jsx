import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { IMAGE_BASE_URL } from "../config/api";
import "../styles/HomePage.css";

const HomePage = ({ onLogout, darkMode, onToggleTheme }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [city, setCity] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [search, setSearch] = useState("");
  const [reviewData, setReviewData] = useState({});
  const [dealReviews, setDealReviews] = useState({}); // Store reviews for each deal
  const [showReviews, setShowReviews] = useState({}); // Track which deals have reviews expanded
  const [loadingReviews, setLoadingReviews] = useState({}); // Track loading state for reviews
  const [loading, setLoading] = useState(false);
  const [activeCity, setActiveCity] = useState("All Cities");
  const [activeCuisine, setActiveCuisine] = useState("All Cuisines");
  const [isAdmin, setIsAdmin] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false); // Filter for featured deals only
  const [sortBy, setSortBy] = useState("top-rated"); // Sort option
  const [showAIModal, setShowAIModal] = useState(false); // AI preferences modal
  const [showRecommendations, setShowRecommendations] = useState(false); // Show AI recommendations
  const [aiRecommendations, setAiRecommendations] = useState([]); // AI recommendations data
  const [loadingAI, setLoadingAI] = useState(false); // Loading state for AI
  const [nowTick, setNowTick] = useState(Date.now());
  const [preferences, setPreferences] = useState({
    cuisine: [],
    spiceLevel: 3,
    budget: "medium",
    dietary: "none",
    city: ""
  });
  const navigate = useNavigate();

  // ✅ UseCallback ensures fetchRestaurants has a stable identity
  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/restaurants", {
        params: { city, cuisine, search, featuredOnly },
      });
      setRestaurants(res.data);
    } catch (err) {
      console.error("Error fetching restaurants:", err.response?.data || err.message);
      alert("Failed to load restaurants. Please check the console for details.");
    } finally {
      setLoading(false);
    }
  }, [city, cuisine, search, featuredOnly]); // dependencies moved here

  // ✅ useEffect now safely depends on fetchRestaurants
  useEffect(() => {
    fetchRestaurants();
    checkAdminStatus();
  }, [fetchRestaurants]);

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const checkAdminStatus = async () => {
    try {
      const res = await api.get("/api/auth/profile");
      setIsAdmin(res.data.isAdmin || false);
    } catch (err) {
      setIsAdmin(false);
    }
  };

  const handleAddFavorite = async (restaurantId, dealId) => {
    try {
      console.log("Attempting to save favorite:", { restaurantId, dealId });
      const res = await api.post(
        "/api/user/favorites",
        { restaurantId, dealId },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      console.log("Favorite saved:", res.data);
      alert("✅ Added to favorites!");
    } catch (err) {
      console.error("Error adding favorite:", err.response?.data || err.message);
      alert(
        "❌ Failed to add to favorites. Check console for details: " +
          (err.response?.data?.message || "Unknown error")
      );
    }
  };

  const handleReviewSubmit = async (restaurantId, dealId) => {
    const { rating, comment } = reviewData[dealId] || {};
    if (!rating) return alert("Please select a rating");

    try {
      await api.post(
        "/api/user/reviews",
        { restaurantId, dealId, rating, comment },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      alert("✅ Review submitted!");
      setReviewData((prev) => ({
        ...prev,
        [dealId]: { rating: "", comment: "" },
      }));
      // Refresh reviews for this deal
      await fetchDealReviews(restaurantId, dealId);
      fetchRestaurants();
    } catch (err) {
      console.error("Error submitting review:", err.response?.data || err.message);
      alert("❌ Failed to submit review. Check console for details.");
    }
  };

  const fetchDealReviews = async (restaurantId, dealId) => {
    const reviewKey = `${restaurantId}-${dealId}`;
    setLoadingReviews((prev) => ({ ...prev, [reviewKey]: true }));
    try {
      const res = await api.get(
        `/api/user/reviews/restaurant/${restaurantId}/deal/${dealId}`
      );
      setDealReviews((prev) => ({
        ...prev,
        [reviewKey]: res.data,
      }));
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setDealReviews((prev) => ({
        ...prev,
        [reviewKey]: { reviews: [], averageRating: 0, totalReviews: 0 },
      }));
    } finally {
      setLoadingReviews((prev) => ({ ...prev, [reviewKey]: false }));
    }
  };

  const toggleReviews = async (restaurantId, dealId) => {
    const reviewKey = `${restaurantId}-${dealId}`;
    const isCurrentlyShown = showReviews[reviewKey];
    
    setShowReviews((prev) => ({
      ...prev,
      [reviewKey]: !isCurrentlyShown,
    }));

    // Fetch reviews if not already loaded and we're showing them
    if (!isCurrentlyShown && !dealReviews[reviewKey]) {
      await fetchDealReviews(restaurantId, dealId);
    }
  };

  // Group restaurants by city, with featured restaurants first
  const restaurantsByCity = restaurants.reduce((acc, restaurant) => {
    const cityName = restaurant.city || "Other";
    if (!acc[cityName]) {
      acc[cityName] = [];
    }
    acc[cityName].push(restaurant);
    return acc;
  }, {});

  // Sort restaurants within each city: featured first
  Object.keys(restaurantsByCity).forEach(cityName => {
    restaurantsByCity[cityName].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });
  });

  // Sort all deals across all restaurants based on sortBy option
  const sortAllDeals = (restaurants) => {
    if (!restaurants || restaurants.length === 0) return restaurants;
    
    // Collect all deals with restaurant info
    const allDeals = [];
    restaurants.forEach((restaurant) => {
      (restaurant.deals || []).forEach((deal) => {
        allDeals.push({
          ...deal,
          restaurantId: restaurant._id,
          restaurantName: restaurant.name,
        });
      });
    });
    
    // Sort all deals
    let sortedDeals = [...allDeals];
    switch (sortBy) {
      case "top-rated":
        sortedDeals.sort((a, b) => {
          const aReviews = a.reviews?.length || 0;
          const bReviews = b.reviews?.length || 0;
          return bReviews - aReviews;
        });
        break;
      case "low-price":
        sortedDeals.sort((a, b) => {
          const aPrice = parseFloat(a.price) || 0;
          const bPrice = parseFloat(b.price) || 0;
          return aPrice - bPrice;
        });
        break;
      case "high-price":
        sortedDeals.sort((a, b) => {
          const aPrice = parseFloat(a.price) || 0;
          const bPrice = parseFloat(b.price) || 0;
          return bPrice - aPrice;
        });
        break;
      default:
        break;
    }
    
    // Group sorted deals back by restaurant
    const dealsByRestaurant = {};
    sortedDeals.forEach((deal) => {
      if (!dealsByRestaurant[deal.restaurantId]) {
        dealsByRestaurant[deal.restaurantId] = [];
      }
      dealsByRestaurant[deal.restaurantId].push(deal);
    });
    
    // Rebuild restaurants with sorted deals
    return restaurants.map((restaurant) => {
      const sortedDeals = dealsByRestaurant[restaurant._id] || [];
      const dealRows = [];
      for (let i = 0; i < sortedDeals.length; i += 4) {
        dealRows.push(sortedDeals.slice(i, i + 4));
      }
      return {
        ...restaurant,
        deals: sortedDeals,
        dealRows,
      };
    });
  };

  // Group deals by restaurant for row display
  const groupDealsByRestaurant = (restaurants) => {
    // First sort all deals across restaurants
    const sortedRestaurants = sortAllDeals(restaurants);
    return sortedRestaurants;
  };

  // City buttons data
  const cities = [
    { name: "All Cities", icon: "🏠" },
    { name: "Vehari", icon: "🌆" },
    { name: "Burewala", icon: "🏙️" },
    { name: "Multan", icon: "🌃" },
  ];

  // Cuisine filter data
  const cuisines = [
    { name: "All Cuisines", icon: "restaurant" },
    { name: "Fast Food", icon: "fastfood" },
    { name: "Pakistani", icon: "ramen_dining" },
    { name: "Chinese", icon: "dinner_dining" },
    { name: "Italian", icon: "pizza_slice" },
    { name: "BBQ", icon: "outdoor_grill" },
  ];

  // AI Recommendation Functions
  const handleAIClick = async () => {
    // Check if user has existing preferences
    setLoadingAI(true);
    try {
      const res = await api.get("/api/user/preferences");
      
      console.log("Preferences check:", res.data);

      if (res.data.success && 
          res.data.preferences && 
          Array.isArray(res.data.preferences.cuisine) && 
          res.data.preferences.cuisine.length > 0) {
        // User has preferences, show recommendations directly
        await fetchAIRecommendations();
      } else {
        // No preferences, show modal to set preferences
        console.log("No preferences found, showing modal");
        if (res.data.preferences) {
          setPreferences(prev => ({
            ...prev,
            ...res.data.preferences
          }));
        }
        setShowAIModal(true);
      }
    } catch (err) {
      console.error("Error checking preferences:", err);
      // No preferences found or error, show modal
      setShowAIModal(true);
    } finally {
      // Only turn off loading if we are NOT fetching recommendations
      // If we are showing modal, we definitely want to turn off loading
      // If we called fetchAIRecommendations, it handles its own loading state, 
      // but we should ensure this function doesn't clear it prematurely if they run in parallel?
      // Actually, since we await fetchAIRecommendations, it will finish before we get here.
      // So setting it to false here is correct.
      setLoadingAI(false);
    }
  };

  const handlePreferenceSubmit = async (e) => {
    e.preventDefault();
    if (preferences.cuisine.length === 0) {
      alert("Please select at least one cuisine preference");
      return;
    }

    setLoadingAI(true);
    try {
      // Save preferences
      await api.post(
        "/api/user/preferences",
        preferences,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }
      );

      // Also inform AI service to update analytics cache
      try {
        const payload = {
          cuisines: preferences.cuisine,
          spice_level: preferences.spiceLevel === 3 ? "Moderate" : (preferences.spiceLevel <= 2 ? "Mild" : "Very Spicy"),
          budget: preferences.budget,
          dietary: preferences.dietary,
          city: preferences.city || ""
        };
        await api.post(
          "/api/customer/ai-recommend",
          payload,
          {
            headers: {
              "X-User-Id": localStorage.getItem("userId") || "",
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          }
        );
      } catch (e2) {}

      // Close modal and fetch recommendations
      setShowAIModal(false);
      await fetchAIRecommendations();
    } catch (err) {
      console.error("Error saving preferences:", err);
      alert("Failed to save preferences. Please try again.");
    } finally {
      setLoadingAI(false);
    }
  };

  const fetchAIRecommendations = async () => {
    setLoadingAI(true);
    setShowRecommendations(true);
    try {
      // Add timestamp to prevent caching
      const res = await api.get("/api/ai/recommendations", {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          'Cache-Control': 'no-cache'
        },
        params: {
          _t: Date.now() // Timestamp to prevent caching
        }
      });

      if (res.data.success) {
        console.log("AI Recommendations received:", res.data.recommendations);
        setAiRecommendations(res.data.recommendations);
      } else {
        alert(res.data.message || "Failed to get recommendations");
      }
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      console.error("Error details:", err.response?.data);
      alert(err.response?.data?.message || "AI service is currently unavailable. Please try again later.");
      setShowRecommendations(false);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleCuisineChange = (cuisineName) => {
    setPreferences(prev => {
      const currentCuisines = prev.cuisine || [];
      if (currentCuisines.includes(cuisineName)) {
        return { ...prev, cuisine: currentCuisines.filter(c => c !== cuisineName) };
      } else {
        return { ...prev, cuisine: [...currentCuisines, cuisineName] };
      }
    });
  };

  return (
    <div className={`home-container ${darkMode ? "dark-mode" : "light-mode"}`}>
      {/* Header Section */}
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
            {isAdmin && (
              <button className="admin-btn" onClick={() => navigate("/admin/dashboard")}>
                ⚙️ Admin
              </button>
            )}
            <button className="profile-btn" onClick={() => navigate("/profile")}>
              👤 Profile
            </button>
            <button className="profile-btn" onClick={() => navigate("/sentiment-analysis")}>
              Sentiment Analysis
            </button>
            <button className="profile-btn" onClick={() => navigate("/sentiment-recommendations")}>
              Sentiment-Based Recommendations
            </button>
            <button className="logout-btn" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>

        {/* Search Bar in Header */}
        <div className="search-bar-header">
          <input
            type="text"
            placeholder="🔍 Search restaurants or cuisines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      {/* AI Button and Cuisine Filter */}
      <div className="ai-cuisine-container">
        <div className="cuisine-nav">
          <button
            className="ai-recommend-btn"
            onClick={handleAIClick}
            disabled={loadingAI}
          >
            🤖 AI Recommendations
          </button>
          
          {cuisines.map((cuisineItem) => (
            <button
              key={cuisineItem.name}
              className={`cuisine-btn ${activeCuisine === cuisineItem.name ? "active" : ""}`}
              onClick={() => {
                setActiveCuisine(cuisineItem.name);
                if (cuisineItem.name === "All Cuisines") {
                  setCuisine("");
                } else {
                  setCuisine(cuisineItem.name);
                }
              }}
            >
              <span className="cuisine-icon">{cuisineItem.icon}</span>
              {cuisineItem.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content with Sidebar */}
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
                <span>Top rated</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="sort"
                  value="low-price"
                  checked={sortBy === "low-price"}
                  onChange={(e) => setSortBy(e.target.value)}
                />
                <span>Low price</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="sort"
                  value="high-price"
                  checked={sortBy === "high-price"}
                  onChange={(e) => setSortBy(e.target.value)}
                />
                <span>High price</span>
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
              <option value="Vehari">Vehari</option>
              <option value="Burewala">Burewala</option>
            </select>
          </div>

          <div className="filter-section">
            <h4 className="filter-title">Cuisines</h4>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={cuisine === "BBQ"}
                  onChange={(e) => setCuisine(e.target.checked ? "BBQ" : "")}
                />
                <span>BBQ</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={cuisine === "Fast Food"}
                  onChange={(e) => setCuisine(e.target.checked ? "Fast Food" : "")}
                />
                <span>Fast Food</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={cuisine === "Chinese"}
                  onChange={(e) => setCuisine(e.target.checked ? "Chinese" : "")}
                />
                <span>Chinese</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={cuisine === "Pakistani"}
                  onChange={(e) => setCuisine(e.target.checked ? "Pakistani" : "")}
                />
                <span>Pakistani</span>
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
        
        {/* Top Brands Section */}
        <div className="top-brands-section" style={{ 
          marginBottom: "32px"
        }}>
          <div className="top-brands-header" style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            marginBottom: "16px"
          }}>
            <h2 style={{ 
              color: darkMode ? "#ffffff" : "#1a1a1a", 
              fontFamily: "'Poppins', sans-serif", 
              fontSize: "1.25rem", 
              fontWeight: 600,
              margin: 0
            }}>
              Top Brands
            </h2>
          </div>

          <div style={{ position: "relative" }}>
            {/* Scroll Button */}
            <button
              className="scroll-button"
              onClick={() => {
                const container = document.getElementById('top-brands-scroll');
                container.scrollBy({ left: 200, behavior: 'smooth' });
              }}
              style={{
                position: "absolute",
                right: "0",
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "#d70f64",
                color: "white",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => {
                e.target.style.background = "#b50850";
                e.target.style.transform = "translateY(-50%) scale(1.1)";
              }}
              onMouseOut={(e) => {
                e.target.style.background = "#d70f64";
                e.target.style.transform = "translateY(-50%) scale(1)";
              }}
            >
              <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "18px" }}>arrow_forward</span>
            </button>

            {/* Horizontal Scrollable Container */}
            <div 
              id="top-brands-scroll"
              className="top-brands-scroll"
              style={{
                display: "flex",
                gap: "12px",
                overflowX: "auto",
                scrollBehavior: "smooth",
                scrollbarWidth: "none", // Firefox
                msOverflowStyle: "none", // IE/Edge
                paddingBottom: "8px",
                paddingRight: "50px" // Add padding to account for scroll button
              }}
              onScroll={(e) => {
                // Hide/show scroll button based on scroll position
                const scrollButton = e.target.parentElement.querySelector('.scroll-button');
                const maxScroll = e.target.scrollWidth - e.target.clientWidth;
                scrollButton.style.display = e.target.scrollLeft >= maxScroll - 50 ? "none" : "flex";
              }}
            >
              {restaurants
                .sort((a, b) => {
                  // Calculate engagement score for each restaurant
                  const getEngagementScore = (restaurant) => {
                    const dealsCount = restaurant.deals?.length || 0;
                    const reviewsCount = restaurant.reviews?.length || 0;
                    const avgRating = restaurant.reviews?.length > 0 
                      ? restaurant.reviews.reduce((sum, r) => sum + r.rating, 0) / restaurant.reviews.length 
                      : 0;
                    
                    // Weight factors for different metrics
                    const dealsWeight = 0.4;  // 40% weight for number of deals
                    const reviewsWeight = 0.3; // 30% weight for number of reviews (proxy for clicks/views)
                    const ratingWeight = 0.3;  // 30% weight for average rating
                    
                    // Calculate weighted score
                    const score = (dealsCount * dealsWeight) + 
                                 (reviewsCount * reviewsWeight) + 
                                 (avgRating * 10 * ratingWeight); // Multiply rating by 10 for better scale
                    
                    return score;
                  };
                  
                  const scoreA = getEngagementScore(a);
                  const scoreB = getEngagementScore(b);
                  
                  // Sort by engagement score (highest first)
                  return scoreB - scoreA;
                })
                .slice(0, 10) // Show top 10 restaurants by engagement
                .map((restaurant) => {
                  const avgRating = restaurant.reviews?.length > 0 
                    ? (restaurant.reviews.reduce((sum, r) => sum + r.rating, 0) / restaurant.reviews.length).toFixed(1)
                    : "0";
                  
                  return (
                    <div 
                      key={restaurant._id} 
                      className="top-brand-card"
                      onClick={() => navigate(`/restaurant/${restaurant._id}`)}
                      style={{
                        cursor: "pointer",
                        textAlign: "center",
                        padding: "16px",
                        background: darkMode ? "#2d2d2d" : "#ffffff",
                        borderRadius: "12px",
                        border: `1px solid ${darkMode ? "#404040" : "#e0e0e0"}`,
                        transition: "all 0.2s ease",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "10px",
                        minWidth: "100px",
                        maxWidth: "100px",
                        flexShrink: 0
                      }}
                      onMouseOver={(e) => {
                        e.target.style.transform = "scale(1.05)";
                        e.target.style.boxShadow = "0 6px 16px rgba(0,0,0,0.2)";
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = "scale(1)";
                        e.target.style.boxShadow = "none";
                      }}
                    >
                      {/* Restaurant Logo/Avatar */}
                      <div className="brand-logo" style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "12px",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: darkMode ? "#1a1a1a" : "#f8f9fa",
                        border: `1px solid ${darkMode ? "#404040" : "#e0e0e0"}`
                      }}>
                        {restaurant.image ? (
                          <img 
                            src={restaurant.image.startsWith('http') ? restaurant.image : (restaurant.image.startsWith('/') ? `${IMAGE_BASE_URL}${restaurant.image}` : `${IMAGE_BASE_URL}/${restaurant.image}`)} 
                            alt={restaurant.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover"
                            }}
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <span style={{ 
                          fontFamily: "'Material Icons'", 
                          fontStyle: "normal", 
                          fontSize: "24px", 
                          color: "#d70f64",
                          display: restaurant.image ? "none" : "flex"
                        }}>
                          restaurant
                        </span>
                      </div>

                      {/* Restaurant Name */}
                      <h4 style={{ 
                        color: darkMode ? "#ffffff" : "#1a1a1a", 
                        fontSize: "0.8rem", 
                        fontWeight: 500,
                        margin: 0,
                        lineHeight: "1.2",
                        textAlign: "center",
                        height: "32px",
                        display: "flex",
                        alignItems: "center",
                        overflow: "hidden"
                      }}>
                        {restaurant.name.length > 15 ? restaurant.name.substring(0, 15) + "..." : restaurant.name}
                      </h4>

                      {/* Deals Available */}
                      <div style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "3px",
                        fontSize: "0.7rem",
                        color: darkMode ? "#b0b0b0" : "#6c757d",
                        fontWeight: "500"
                      }}>
                        <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "12px", color: "#d70f64" }}>local_offer</span>
                        {restaurant.deals?.length || 0} deals
                      </div>

                      {/* Cuisine Type */}
                      <div style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "3px",
                        fontSize: "0.7rem",
                        color: darkMode ? "#b0b0b0" : "#6c757d",
                        fontWeight: "500"
                      }}>
                        <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "12px", color: "#d70f64" }}>restaurant_menu</span>
                        {restaurant.cuisine?.length > 15 ? restaurant.cuisine.substring(0, 15) + "..." : restaurant.cuisine || "Various"}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
        
        {/* AI Recommendations Section */}
        {showRecommendations && (
          <div className="ai-recommendations-section">
            <div className="ai-section-header">
              <h2>🤖 AI-Powered Recommendations</h2>
              <div style={{ display: "flex", gap: "8px" }}>
                <button 
                  className="refresh-ai-btn"
                  onClick={fetchAIRecommendations}
                  disabled={loadingAI}
                  title="Refresh recommendations"
                >
                  🔄 Refresh
                </button>
                <button 
                  className="close-ai-btn"
                  onClick={() => {
                    setShowRecommendations(false);
                    setAiRecommendations([]);
                  }}
                >
                  ✕ Close
                </button>
              </div>
            </div>
            {loadingAI ? (
              <div className="loading">
                <div className="spinner"></div>
                <p>AI is analyzing your preferences...</p>
              </div>
            ) : aiRecommendations.length > 0 ? (
              <div className="recommendations-grid">
                {aiRecommendations.map((rec, index) => {
                  const restaurant = rec.restaurant;
                  return (
                    <div key={restaurant._id || index} className="ai-recommendation-card">
                      <div className="ai-badge">
                        <span className="ai-icon">🤖</span>
                        <span className="match-score">{rec.match_percentage}% Match</span>
                      </div>
                      <div className="recommendation-content">
                        <h3
                          onClick={async () => {
                            try {
                              await api.post(
                                "/api/analytics/click",
                                { restaurantId: restaurant._id }
                              );
                            } catch (err) {}
                            try {
                              const firstDeal = (restaurant.deals && restaurant.deals[0]) || null;
                              if (firstDeal) {
                                await api.post(
                                  "/api/analytics/interaction",
                                  {
                                    userId: localStorage.getItem("userId"),
                                    deal_id: firstDeal._id || firstDeal.deal_id || firstDeal.title,
                                    action_type: "click",
                                    city: restaurant.city || ""
                                  },
                                  {
                                    headers: {
                                      Authorization: `Bearer ${localStorage.getItem("token")}`,
                                      "X-User-Id": localStorage.getItem("userId") || ""
                                    }
                                  }
                                );
                              }
                            } catch (err) {}
                            navigate(`/restaurant/${restaurant._id}`);
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          {restaurant.name}
                        </h3>
                        <p className="ai-explanation">{rec.explanation}</p>
                        <div className="restaurant-info">
                          <span>📍 {restaurant.city}</span>
                          <span>🍴 {restaurant.cuisine}</span>
                        </div>
                        
                        {restaurant.deals && restaurant.deals.length > 0 && (
                          <div className="deals-preview-list">
                            <p className="deals-header" style={{ fontWeight: 'bold', marginTop: '10px', marginBottom: '5px' }}>Matched Deals:</p>
                            {restaurant.deals.map((deal, i) => (
                              <div key={i} className="deal-preview-item" style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                padding: '5px 0',
                                borderBottom: i < restaurant.deals.length - 1 ? '1px dashed #eee' : 'none'
                              }}>
                                <span className="deal-title" style={{ fontSize: '0.9rem' }}>{deal.title}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span className="deal-price" style={{ fontWeight: 'bold', color: '#d70f64' }}>Rs. {deal.price}</span>
                                  <a
                                    className="view-deal-link"
                                    href="#"
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      try {
                                        await api.post(
                                          "/api/user/deal-interaction",
                                          {
                                            userId: localStorage.getItem("userId"),
                                            deal_id: deal._id || deal.deal_id || deal.title,
                                            action: "view",
                                            city: restaurant.city || ""
                                          },
                                          {
                                            headers: { 
                                              Authorization: `Bearer ${localStorage.getItem("token")}`,
                                              "X-User-Id": localStorage.getItem("userId") || ""
                                            }
                                          }
                                        );
                                      } catch (err) {
                                        console.error("Error recording deal view:", err);
                                      }
                                      const targetDealId = deal._id || deal.deal_id;
                                      if (targetDealId) {
                                        navigate(`/restaurant/${restaurant._id}/deal/${targetDealId}`);
                                      } else {
                                        navigate(`/restaurant/${restaurant._id}`);
                                      }
                                    }}
                                  >
                                    View
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <button
                          className="view-restaurant-btn"
                          onClick={async () => {
                            try {
                              await api.post(
                                "/api/analytics/click",
                                { restaurantId: restaurant._id }
                              );
                            } catch (err) {}
                            try {
                              const firstDeal = (restaurant.deals && restaurant.deals[0]) || null;
                              if (firstDeal) {
                                await api.post(
                                  "/api/analytics/interaction",
                                  {
                                    userId: localStorage.getItem("userId"),
                                    deal_id: firstDeal._id || firstDeal.deal_id || firstDeal.title,
                                    action_type: "selection",
                                    city: restaurant.city || ""
                                  },
                                  {
                                    headers: {
                                      Authorization: `Bearer ${localStorage.getItem("token")}`,
                                      "X-User-Id": localStorage.getItem("userId") || ""
                                    }
                                  }
                                );
                              }
                            } catch (err) {}
                            navigate(`/restaurant/${restaurant._id}`);
                          }}
                        >
                          View Restaurant →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-recommendations">
                <p>No recommendations available at this time.</p>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading restaurants...</p>
          </div>
        ) : restaurants.length > 0 ? (
          Object.entries(restaurantsByCity).map(([cityName, cityRestaurants]) => {
            return (
              <div key={cityName} className="city-section">
                <div className="city-header">
                  <h2>{cityName}: Restaurants</h2>
                  <p>Discover amazing restaurants in {cityName}</p>
                </div>

                <div className="restaurants-grid">
                  {cityRestaurants.map((restaurant) => (
                    <div 
                      key={restaurant._id} 
                      className={`restaurant-card ${restaurant.featured ? 'featured-restaurant' : ''}`}
                      onClick={() => navigate(`/restaurant/${restaurant._id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      {/* Restaurant Image */}
                      <div className="restaurant-image-container">
                        {restaurant.image ? (
                          <img 
                            src={restaurant.image.startsWith('http') ? restaurant.image : (restaurant.image.startsWith('/') ? `${IMAGE_BASE_URL}${restaurant.image}` : `${IMAGE_BASE_URL}/${restaurant.image}`)} 
                            alt={restaurant.name}
                            className="restaurant-image"
                            onError={(e) => {
                              e.target.src = '/placeholder-restaurant.jpg';
                            }}
                          />
                        ) : (
                          <div className="restaurant-image-placeholder">
                            <span className="restaurant-icon">restaurant</span>
                          </div>
                        )}
                        {restaurant.featured && (
                          <div className="featured-badge">Featured</div>
                        )}
                      </div>

                      {/* Restaurant Info */}
                      <div className="restaurant-info-card">
                        <h3 className="restaurant-name">{restaurant.name}</h3>
                        
                        <div className="restaurant-meta" style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "8px", 
                          marginBottom: "8px",
                          color: darkMode ? "#b0b0b0" : "#6c757d",
                          fontSize: "0.9rem"
                        }}>
                          <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "16px", color: "#d70f64" }}>location_on</span>
                          <span>{restaurant.city}</span>
                        </div>
                        
                        <div className="restaurant-meta" style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "8px", 
                          marginBottom: "12px",
                          color: darkMode ? "#b0b0b0" : "#6c757d",
                          fontSize: "0.9rem"
                        }}>
                          <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "16px", color: "#d70f64" }}>restaurant_menu</span>
                          <span>{restaurant.cuisine}</span>
                        </div>

                        <div className="restaurant-meta" style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "8px", 
                          marginBottom: "12px",
                          color: darkMode ? "#b0b0b0" : "#6c757d",
                          fontSize: "0.9rem"
                        }}>
                          <span style={{ fontFamily: "'Material Icons'", fontStyle: "normal", fontSize: "16px", color: "#d70f64" }}>local_offer</span>
                          <span>{restaurant.deals?.length || 0} Deals Available</span>
                        </div>

                        <button 
                          className="view-deals-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/restaurant/${restaurant._id}`);
                          }}
                          style={{
                            width: "calc(100% - 24px)",
                            padding: "10px 16px",
                            background: "#d70f64",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "0.9rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 12px 16px 12px",
                            transition: "all 0.2s ease"
                          }}
                          onMouseOver={(e) => e.target.style.background = "#b50850"}
                          onMouseOut={(e) => e.target.style.background = "#d70f64"}
                        >
                          View Deals
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="no-restaurants">
            <h2>No restaurants found</h2>
            <p>Try adjusting your filters or search criteria.</p>
          </div>
        )}
        </main>
      </div>

      {/* AI Preferences Modal */}
      {showAIModal && (
        <div className="ai-modal-overlay" onClick={() => setShowAIModal(false)}>
          <div className="ai-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="ai-modal-header">
              <h2>🤖 AI Restaurant Recommendations</h2>
              <button className="close-modal-btn" onClick={() => setShowAIModal(false)}>✕</button>
            </div>
            <form onSubmit={handlePreferenceSubmit} className="preferences-form">
              <div className="form-group">
                <label>Cuisine Preferences * (Select at least one)</label>
                <div className="cuisine-checkboxes">
                  {["Pakistani", "BBQ", "Chinese", "Fast Food", "Italian", "Thai", "Indian"].map((cuisineName) => (
                    <label key={cuisineName} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={preferences.cuisine.includes(cuisineName)}
                        onChange={() => handleCuisineChange(cuisineName)}
                      />
                      <span>{cuisineName}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Spice Level: {preferences.spiceLevel} {preferences.spiceLevel === 1 ? "🌶️ (Mild)" : preferences.spiceLevel === 5 ? "🌶️🌶️🌶️🌶️🌶️ (Very Spicy)" : "🌶️🌶️🌶️ (Moderate)"}</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={preferences.spiceLevel}
                  onChange={(e) => setPreferences({ ...preferences, spiceLevel: parseInt(e.target.value) })}
                  className="spice-slider"
                />
                <div className="spice-labels">
                  <span>Mild</span>
                  <span>Very Spicy</span>
                </div>
              </div>

              <div className="form-group">
                <label>Budget</label>
                <select
                  value={preferences.budget}
                  onChange={(e) => setPreferences({ ...preferences, budget: e.target.value })}
                  className="form-select"
                >
                  <option value="low">Low (Under Rs. 500)</option>
                  <option value="medium">Medium (Rs. 500 - 1500)</option>
                  <option value="high">High (Above Rs. 1500)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Dietary Preference</label>
                <select
                  value={preferences.dietary}
                  onChange={(e) => setPreferences({ ...preferences, dietary: e.target.value })}
                  className="form-select"
                >
                  <option value="none">None</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="halal">Halal</option>
                  <option value="vegan">Vegan</option>
                </select>
              </div>

              <div className="form-group">
                <label>Preferred City</label>
                <select
                  value={preferences.city}
                  onChange={(e) => setPreferences({ ...preferences, city: e.target.value })}
                  className="form-select"
                >
                  <option value="">Any City</option>
                  <option value="Multan">Multan</option>
                  <option value="Vehari">Vehari</option>
                  <option value="Burewala">Burewala</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-preferences-btn" disabled={loadingAI}>
                  {loadingAI ? "Processing..." : "Get AI Recommendations"}
                </button>
                <button type="button" className="cancel-btn" onClick={() => setShowAIModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
