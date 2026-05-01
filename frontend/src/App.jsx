import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRestaurants from "./pages/AdminRestaurants";
import AdminDeals from "./pages/AdminDeals";
import AdminMenuUpload from "./pages/AdminMenuUpload";
import AdminPendingRequests from "./pages/AdminPendingRequests";
import AdminSubscriptions from "./pages/AdminSubscriptions";
import AdminAnalytics from "./pages/AdminAnalytics";
import RestaurantManagerLogin from "./pages/RestaurantManagerLogin";
import RestaurantManagerSignup from "./pages/RestaurantManagerSignup";
import RestaurantManagerDashboard from "./pages/RestaurantManagerDashboard";
import SubscriptionPage from "./pages/SubscriptionPage";
import RestaurantDetails from "./pages/RestaurantDetails";
import DealDetails from "./pages/DealDetails";
import SentimentAnalysis from "./pages/SentimentAnalysis";
import SentimentRecommendations from "./pages/SentimentRecommendations";
import api from "./api";

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState(localStorage.getItem("role") || "customer");
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved !== null ? saved === "true" : true;
  });
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
      // Check user role and admin status
      checkUserStatus();
    } else {
      setIsAuthenticated(false);
      setIsAdmin(false);
      setUserRole("customer");
    }
  }, [location]); // Re-check authentication on route change

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode ? "true" : "false");
  }, [darkMode]);

  const toggleTheme = () => setDarkMode((prev) => !prev);

  const checkUserStatus = async () => {
    try {
      const res = await api.get("/api/auth/profile");
      setIsAdmin(res.data.isAdmin || false);
      const role = res.data.role || (res.data.isAdmin ? 'admin' : 'customer');
      setUserRole(role);
      localStorage.setItem("role", role);
    } catch (err) {
      console.error("Error checking user status:", err);
      setIsAdmin(false);
      setUserRole("customer");
    }
  };

  const handleLogin = async (token, role) => {
    localStorage.setItem("token", token);
    if (role) {
      localStorage.setItem("role", role);
      setUserRole(role);
    }
    setIsAuthenticated(true);
    // Check user status after login
    await checkUserStatus();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setIsAuthenticated(false);
    setIsAdmin(false);
    setUserRole("customer");
  };

  return (
    <Routes>
      <Route
        path="/"
        element={!isAuthenticated ? <LoginPage onLogin={handleLogin} /> : <Navigate to="/home" />}
      />
      <Route
        path="/signup"
        element={!isAuthenticated ? <SignupPage /> : <Navigate to="/home" />}
      />
      <Route
        path="/home"
        element={
          isAuthenticated && userRole === 'customer' ? (
            <HomePage onLogout={handleLogout} darkMode={darkMode} onToggleTheme={toggleTheme} />
          ) : isAuthenticated && userRole === 'restaurantManager' ? (
            <Navigate to="/manager/dashboard" />
          ) : isAuthenticated && isAdmin ? (
            <Navigate to="/admin/dashboard" />
          ) : (
            <Navigate to="/" />
          )
        }
      />
      <Route
        path="/profile"
        element={
          isAuthenticated && userRole === 'customer' ? (
            <ProfilePage onLogout={handleLogout} darkMode={darkMode} onToggleTheme={toggleTheme} />
          ) : (
            <Navigate to="/" />
          )
        }
      />
      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={isAuthenticated && isAdmin ? <AdminDashboard onLogout={handleLogout} darkMode={darkMode} onToggleTheme={toggleTheme} /> : <Navigate to="/home" />}
      />
      <Route
        path="/admin/restaurants"
        element={isAuthenticated && isAdmin ? <AdminRestaurants onLogout={handleLogout} darkMode={darkMode} onToggleTheme={toggleTheme} isAdmin={isAdmin} /> : <Navigate to="/home" />}
      />
      <Route
        path="/admin/deals"
        element={isAuthenticated && isAdmin ? <AdminDeals onLogout={handleLogout} darkMode={darkMode} onToggleTheme={toggleTheme} /> : <Navigate to="/home" />}
      />
      <Route
        path="/admin/menu"
        element={isAuthenticated && isAdmin ? <AdminMenuUpload onLogout={handleLogout} darkMode={darkMode} onToggleTheme={toggleTheme} /> : <Navigate to="/home" />}
      />
      <Route
        path="/admin/pending"
        element={isAuthenticated && isAdmin ? <AdminPendingRequests onLogout={handleLogout} darkMode={darkMode} onToggleTheme={toggleTheme} /> : <Navigate to="/home" />}
      />
      <Route
        path="/admin/subscriptions"
        element={isAuthenticated && isAdmin ? <AdminSubscriptions onLogout={handleLogout} darkMode={darkMode} onToggleTheme={toggleTheme} /> : <Navigate to="/home" />}
      />
      <Route
        path="/admin/analytics"
        element={isAuthenticated && isAdmin ? <AdminAnalytics onLogout={handleLogout} darkMode={darkMode} onToggleTheme={toggleTheme} /> : <Navigate to="/home" />}
      />
      {/* Restaurant Manager Routes */}
      <Route
        path="/manager/login"
        element={
          !isAuthenticated ? (
            <RestaurantManagerLogin onLogin={handleLogin} />
          ) : userRole === 'restaurantManager' ? (
            <Navigate to="/manager/dashboard" />
          ) : isAdmin ? (
            <Navigate to="/admin/dashboard" />
          ) : (
            <Navigate to="/home" />
          )
        }
      />
      <Route
        path="/manager/signup"
        element={
          !isAuthenticated ? (
            <RestaurantManagerSignup />
          ) : userRole === 'restaurantManager' ? (
            <Navigate to="/manager/dashboard" />
          ) : isAdmin ? (
            <Navigate to="/admin/dashboard" />
          ) : (
            <Navigate to="/home" />
          )
        }
      />
      <Route
        path="/manager/dashboard"
        element={
          isAuthenticated && userRole === 'restaurantManager' ? (
            <RestaurantManagerDashboard onLogout={handleLogout} darkMode={darkMode} onToggleTheme={toggleTheme} />
          ) : (
            <Navigate to="/manager/login" />
          )
        }
      />
      <Route
        path="/manager/subscription"
        element={
          isAuthenticated && userRole === 'restaurantManager' ? (
            <SubscriptionPage onLogout={handleLogout} darkMode={darkMode} onToggleTheme={toggleTheme} />
          ) : (
            <Navigate to="/manager/login" />
          )
        }
      />
      {/* Restaurant and Deal Details Routes */}
      <Route
        path="/restaurant/:restaurantId"
        element={
          isAuthenticated && userRole === 'customer' ? (
            <RestaurantDetails onLogout={handleLogout} darkMode={darkMode} onToggleTheme={toggleTheme} />
          ) : (
            <Navigate to="/" />
          )
        }
      />
      <Route
        path="/restaurant/:restaurantId/deal/:dealId"
        element={
          isAuthenticated && userRole === 'customer' ? (
            <DealDetails onLogout={handleLogout} darkMode={darkMode} onToggleTheme={toggleTheme} />
          ) : (
            <Navigate to="/" />
          )
        }
      />
      <Route
        path="/sentiment-analysis"
        element={
          isAuthenticated ? (
            <SentimentAnalysis onLogout={handleLogout} darkMode={darkMode} onToggleTheme={toggleTheme} />
          ) : (
            <Navigate to="/" />
          )
        }
      />
      <Route
        path="/sentiment-recommendations"
        element={
          isAuthenticated ? (
            <SentimentRecommendations onLogout={handleLogout} darkMode={darkMode} onToggleTheme={toggleTheme} />
          ) : (
            <Navigate to="/" />
          )
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
