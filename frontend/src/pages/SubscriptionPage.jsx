import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/AdminDashboard.css";

const SubscriptionPage = ({ onLogout, darkMode, onToggleTheme }) => {
  const [plans, setPlans] = useState({});
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlans();
    fetchMySubscription();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await api.get("/api/subscriptions/plans");
      if (res.data.success) {
        setPlans(res.data.plans);
      }
    } catch (err) {
      console.error("Error fetching plans:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMySubscription = async () => {
    try {
      const res = await api.get("/api/subscriptions/my-subscription");
      if (res.data.success) {
        setCurrentSubscription(res.data);
      }
    } catch (err) {
      console.error("Error fetching subscription:", err);
    }
  };

  const handleSubscribe = async (plan) => {
    if (!window.confirm(`Subscribe to ${plans[plan].name} for $${plans[plan].price}?`)) {
      return;
    }

    try {
      const res = await api.post(
        "/api/subscriptions/subscribe",
        {
          plan,
          paymentMethod: "manual", // In production, integrate with payment gateway
          transactionId: `TXN-${Date.now()}`
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }
      );
      if (res.data.success) {
        alert(`✅ Successfully subscribed to ${plans[plan].name}!`);
        fetchMySubscription();
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
          <h1>💳 Subscription Plans</h1>
          <div className="header-buttons">
            <button
              className="theme-toggle-btn"
              onClick={onToggleTheme}
            >
              {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
            <button className="nav-btn" onClick={() => navigate("/manager/dashboard")}>
              ← Back to Dashboard
            </button>
            <button className="logout-btn" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        {currentSubscription && currentSubscription.subscription && (
          <div className="section-card">
            <h2>Current Subscription</h2>
            <div className="subscription-info">
              <p><strong>Plan:</strong> {currentSubscription.currentPlan}</p>
              <p><strong>Status:</strong> {currentSubscription.subscription.status}</p>
              <p><strong>Amount Paid:</strong> ${currentSubscription.subscription.amount}</p>
              <p><strong>Payment Date:</strong> {new Date(currentSubscription.subscription.paymentDate).toLocaleDateString()}</p>
              {currentSubscription.subscription.expiryDate && (
                <p><strong>Expires:</strong> {new Date(currentSubscription.subscription.expiryDate).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        )}

        <div className="plans-grid">
          {Object.entries(plans).map(([planKey, plan]) => (
            <div key={planKey} className="plan-card">
              <h3>{plan.name}</h3>
              <div className="plan-price">${plan.price}<span>/month</span></div>
              <ul className="plan-features">
                {plan.features.map((feature, idx) => (
                  <li key={idx}>✓ {feature}</li>
                ))}
              </ul>
              <button
                className={`subscribe-btn ${currentSubscription?.currentPlan === planKey ? 'current-plan' : ''}`}
                onClick={() => handleSubscribe(planKey)}
                disabled={currentSubscription?.currentPlan === planKey}
              >
                {currentSubscription?.currentPlan === planKey ? 'Current Plan' : `Subscribe to ${plan.name}`}
              </button>
            </div>
          ))}
        </div>

        <div className="section-card">
          <h3>💡 Why Subscribe?</h3>
          <ul>
            <li>Get your restaurant featured in search results</li>
            <li>Feature your deals prominently</li>
            <li>Reach more customers</li>
            <li>Priority support from DineMate</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default SubscriptionPage;

