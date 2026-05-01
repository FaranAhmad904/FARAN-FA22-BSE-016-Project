import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/AdminDashboard.css";

const AdminPendingRequests = ({ onLogout, darkMode, onToggleTheme }) => {
  const [pendingRestaurants, setPendingRestaurants] = useState([]);
  const [pendingDeals, setPendingDeals] = useState([]);
  const [activeTab, setActiveTab] = useState("restaurants");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingRestaurants();
    fetchPendingDeals();
  }, []);

  const fetchPendingRestaurants = async () => {
    try {
      const res = await axios.get("http://localhost:7000/api/admin/pending/restaurants", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.data.success) {
        setPendingRestaurants(res.data.restaurants);
      }
    } catch (err) {
      console.error("Error fetching pending restaurants:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingDeals = async () => {
    try {
      const res = await axios.get("http://localhost:7000/api/admin/pending/deals", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.data.success) {
        setPendingDeals(res.data.deals);
      }
    } catch (err) {
      console.error("Error fetching pending deals:", err);
    }
  };

  const handleApproveRestaurant = async (id) => {
    if (!window.confirm("Approve this restaurant?")) return;
    try {
      const res = await axios.put(
        `http://localhost:7000/api/admin/restaurants/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (res.data.success) {
        alert("✅ Restaurant approved!");
        fetchPendingRestaurants();
      }
    } catch (err) {
      alert("❌ Error: " + (err.response?.data?.message || err.message));
    }
  };

  const handleRejectRestaurant = async (id) => {
    if (!window.confirm("Reject this restaurant?")) return;
    try {
      const res = await axios.put(
        `http://localhost:7000/api/admin/restaurants/${id}/reject`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (res.data.success) {
        alert("Restaurant rejected");
        fetchPendingRestaurants();
      }
    } catch (err) {
      alert("❌ Error: " + (err.response?.data?.message || err.message));
    }
  };

  const handleApproveDeal = async (restaurantId, dealId) => {
    if (!window.confirm("Approve this deal?")) return;
    try {
      const res = await axios.put(
        `http://localhost:7000/api/admin/restaurants/${restaurantId}/deals/${dealId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (res.data.success) {
        alert("✅ Deal approved!");
        fetchPendingDeals();
      }
    } catch (err) {
      alert("❌ Error: " + (err.response?.data?.message || err.message));
    }
  };

  const handleRejectDeal = async (restaurantId, dealId) => {
    if (!window.confirm("Reject this deal?")) return;
    try {
      const res = await axios.put(
        `http://localhost:7000/api/admin/restaurants/${restaurantId}/deals/${dealId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (res.data.success) {
        alert("Deal rejected");
        fetchPendingDeals();
      }
    } catch (err) {
      alert("❌ Error: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`admin-container ${darkMode ? "dark-mode" : "light-mode"}`}>
      <header className="admin-header">
        <div className="header-top">
          <h1>⏳ Pending Requests</h1>
          <div className="header-buttons">
            <button
              className="theme-toggle-btn"
              onClick={onToggleTheme}
            >
              {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
            <button className="nav-btn" onClick={() => navigate("/admin/dashboard")}>
              ← Dashboard
            </button>
            <button className="logout-btn" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === "restaurants" ? "active" : ""}`}
            onClick={() => setActiveTab("restaurants")}
          >
            🏪 Restaurants ({pendingRestaurants.length})
          </button>
          <button
            className={`tab-btn ${activeTab === "deals" ? "active" : ""}`}
            onClick={() => setActiveTab("deals")}
          >
            🎯 Deals ({pendingDeals.length})
          </button>
        </div>

        {activeTab === "restaurants" && (
          <div className="pending-section">
            <h2>Pending Restaurants</h2>
            {pendingRestaurants.length > 0 ? (
              <div className="pending-list">
                {pendingRestaurants.map((restaurant) => (
                  <div key={restaurant._id} className="pending-card">
                    <div className="pending-info">
                      <h3>{restaurant.name}</h3>
                      <p><strong>City:</strong> {restaurant.city}</p>
                      <p><strong>Cuisine:</strong> {restaurant.cuisine || "N/A"}</p>
                      {restaurant.restaurantManagerId && (
                        <p><strong>Manager:</strong> {restaurant.restaurantManagerId.name || restaurant.restaurantManagerId.email}</p>
                      )}
                      <p><strong>Submitted:</strong> {new Date(restaurant.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="pending-actions">
                      <button
                        className="approve-btn"
                        onClick={() => handleApproveRestaurant(restaurant._id)}
                      >
                        ✅ Approve
                      </button>
                      <button
                        className="reject-btn"
                        onClick={() => handleRejectRestaurant(restaurant._id)}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">No pending restaurants</p>
            )}
          </div>
        )}

        {activeTab === "deals" && (
          <div className="pending-section">
            <h2>Pending Deals</h2>
            {pendingDeals.length > 0 ? (
              <div className="pending-list">
                {pendingDeals.map((deal) => (
                  <div key={deal._id} className="pending-card">
                    {deal.image && (
                      <img src={deal.image} alt={deal.title} className="pending-image" />
                    )}
                    <div className="pending-info">
                      <h3>{deal.title}</h3>
                      {deal.dealType && (
                        <p><strong>Type:</strong> {deal.dealType.charAt(0).toUpperCase() + deal.dealType.slice(1)}</p>
                      )}
                      {deal.startTime && (
                        <p><strong>Start:</strong> {new Date(deal.startTime).toLocaleString()}</p>
                      )}
                      {deal.endTime && (
                        <p><strong>Expiry:</strong> {new Date(deal.endTime).toLocaleString()}</p>
                      )}
                      <p><strong>Restaurant:</strong> {deal.restaurantName}</p>
                      <p><strong>City:</strong> {deal.restaurantCity}</p>
                      <p><strong>Description:</strong> {deal.description || "N/A"}</p>
                      <p><strong>Price:</strong> ${deal.price}</p>
                      {deal.restaurantManager && (
                        <p><strong>Manager:</strong> {deal.restaurantManager.name || deal.restaurantManager.email}</p>
                      )}
                      <p><strong>Submitted:</strong> {new Date(deal.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="pending-actions">
                      <button
                        className="approve-btn"
                        onClick={() => handleApproveDeal(deal.restaurantId, deal._id)}
                      >
                        ✅ Approve
                      </button>
                      <button
                        className="reject-btn"
                        onClick={() => handleRejectDeal(deal.restaurantId, deal._id)}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">No pending deals</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPendingRequests;

