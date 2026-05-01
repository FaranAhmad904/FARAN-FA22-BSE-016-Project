import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/AdminDashboard.css";

const AdminDashboard = ({ onLogout, darkMode, onToggleTheme }) => {
  const [stats, setStats] = useState({
    totalRestaurants: 0,
    totalDeals: 0,
    totalCities: 0,
    pendingRestaurants: 0,
    pendingDeals: 0,
    restaurants: []
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/dashboard");
      setStats(res.data);
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      alert("Failed to load dashboard. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`admin-container ${darkMode ? "dark-mode" : "light-mode"}`}>
      <header className="admin-header">
        <div className="header-top">
          <h1>⚙️ Admin Dashboard</h1>
          <div className="header-buttons">
            <button
              className="theme-toggle-btn"
              onClick={onToggleTheme}
            >
              {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
            <button className="nav-btn" onClick={() => navigate("/admin/restaurants")}>
              🏪 Restaurants
            </button>
            <button className="nav-btn" onClick={() => navigate("/admin/deals")}>
              🎯 Deals
            </button>
            <button className="nav-btn" onClick={() => navigate("/admin/pending")}>
              ⏳ Pending Requests
            </button>
            <button className="nav-btn" onClick={() => navigate("/admin/subscriptions")}>
              💳 Subscriptions
            </button>
            <button className="nav-btn" onClick={() => navigate("/admin/analytics")}>
              📈 Analytics
            </button>
            <button className="nav-btn" onClick={() => navigate("/home")}>
              🏠 Home
            </button>
            <button className="logout-btn" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading dashboard...</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🏪</div>
                <div className="stat-info">
                  <h3>{stats.totalRestaurants}</h3>
                  <p>Total Restaurants</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-info">
                  <h3>{stats.totalDeals}</h3>
                  <p>Total Deals</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🌍</div>
                <div className="stat-info">
                  <h3>{stats.totalCities}</h3>
                  <p>Cities</p>
                </div>
              </div>
              <div className="stat-card alert">
                <div className="stat-icon">⏳</div>
                <div className="stat-info">
                  <h3>{stats.pendingRestaurants || 0}</h3>
                  <p>Pending Restaurants</p>
                </div>
              </div>
              <div className="stat-card alert">
                <div className="stat-icon">🎯</div>
                <div className="stat-info">
                  <h3>{stats.pendingDeals || 0}</h3>
                  <p>Pending Deals</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <h2>Quick Actions</h2>
              <div className="action-buttons">
                <button
                  className="action-btn"
                  onClick={() => navigate("/admin/restaurants?action=add")}
                >
                  ➕ Add Restaurant
                </button>
                <button
                  className="action-btn"
                  onClick={() => navigate("/admin/deals?action=add")}
                >
                  🎯 Create Deal
                </button>
                <button
                  className="action-btn"
                  onClick={() => navigate("/admin/restaurants")}
                >
                  📋 Manage Restaurants
                </button>
                <button
                  className="action-btn alert"
                  onClick={() => navigate("/admin/pending")}
                >
                  ⏳ Review Pending Requests
                </button>
              </div>
            </div>

            {/* Recent Restaurants */}
            <div className="recent-section">
              <h2>Recent Restaurants</h2>
              {stats.restaurants.length > 0 ? (
                <div className="restaurants-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>City</th>
                        <th>Cuisine</th>
                        <th>Deals</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.restaurants.slice(0, 10).map((restaurant) => (
                        <tr key={restaurant._id}>
                          <td>{restaurant.name}</td>
                          <td>{restaurant.city}</td>
                          <td>{restaurant.cuisine || "N/A"}</td>
                          <td>{restaurant.dealsCount}</td>
                          <td>
                            <button
                              className="edit-btn"
                              onClick={() => navigate(`/admin/restaurants?edit=${restaurant._id}`)}
                            >
                              ✏️ Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-data">No restaurants yet. Add your first restaurant!</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;

