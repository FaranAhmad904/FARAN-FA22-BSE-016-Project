import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/AdminDashboard.css";

const AdminSubscriptions = ({ onLogout, darkMode, onToggleTheme }) => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const res = await axios.get("http://localhost:7000/api/subscriptions/all", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.data.success) {
        setSubscriptions(res.data.subscriptions);
      }
    } catch (err) {
      console.error("Error fetching subscriptions:", err);
    } finally {
      setLoading(false);
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
          <h1>💳 Subscriptions</h1>
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
        <div className="section-card">
          <h2>All Subscriptions</h2>
          {subscriptions.length > 0 ? (
            <div className="subscriptions-table">
              <table>
                <thead>
                  <tr>
                    <th>Restaurant</th>
                    <th>Manager</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Payment Date</th>
                    <th>Expiry Date</th>
                    <th>Transaction ID</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub) => (
                    <tr key={sub._id}>
                      <td>{sub.restaurantId?.name || "N/A"}</td>
                      <td>{sub.restaurantManagerId?.name || sub.restaurantManagerId?.email || "N/A"}</td>
                      <td>{sub.plan}</td>
                      <td>${sub.amount}</td>
                      <td>
                        <span className={`status-badge ${sub.status}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td>{sub.paymentDate ? new Date(sub.paymentDate).toLocaleDateString() : "N/A"}</td>
                      <td>{sub.expiryDate ? new Date(sub.expiryDate).toLocaleDateString() : "N/A"}</td>
                      <td>{sub.transactionId || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-data">No subscriptions yet</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminSubscriptions;

