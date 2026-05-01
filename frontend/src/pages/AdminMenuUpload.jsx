import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/AdminDashboard.css";

const AdminMenuUpload = ({ onLogout, darkMode, onToggleTheme }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  const [menuUrl, setMenuUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRestaurants();
  }, []);

  useEffect(() => {}, []);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:7000/api/admin/restaurants", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setRestaurants(res.data);
    } catch (err) {
      console.error("Error fetching restaurants:", err);
      alert("Failed to load restaurants.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestaurantChange = (e) => {
    const restaurantId = e.target.value;
    setSelectedRestaurant(restaurantId);
    const restaurant = restaurants.find(r => r._id === restaurantId);
    if (restaurant) {
      setMenuUrl(restaurant.menu || "");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRestaurant) {
      alert("Please select a restaurant!");
      return;
    }

    try {
      await axios.post(
        `http://localhost:7000/api/admin/restaurants/${selectedRestaurant}/menu`,
        { menuUrl },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }
      );
      alert("✅ Menu uploaded successfully!");
      fetchRestaurants();
    } catch (err) {
      console.error("Error uploading menu:", err);
      alert("❌ Failed to upload menu. Check console for details.");
    }
  };

  return (
    <div className={`admin-container ${darkMode ? "dark-mode" : "light-mode"}`}>
      <header className="admin-header">
        <div className="header-top">
          <h1>📄 Menu Upload</h1>
          <div className="header-buttons">
            <button
              className="theme-toggle-btn"
              onClick={onToggleTheme}
            >
              {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
            <button className="nav-btn" onClick={() => navigate("/admin/dashboard")}>
              📊 Dashboard
            </button>
            <button className="nav-btn" onClick={() => navigate("/admin/restaurants")}>
              🏪 Restaurants
            </button>
            <button className="nav-btn" onClick={() => navigate("/admin/deals")}>
              🎯 Deals
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
        <div className="page-header">
          <h2>Upload Restaurant Menu</h2>
        </div>

        <div className="menu-upload-form">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Select Restaurant *</label>
              <select
                value={selectedRestaurant}
                onChange={handleRestaurantChange}
                required
                className="restaurant-select"
              >
                <option value="">-- Select Restaurant --</option>
                {restaurants.map((restaurant) => (
                  <option key={restaurant._id} value={restaurant._id}>
                    {restaurant.name} - {restaurant.city}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Menu URL *</label>
              <input
                type="url"
                value={menuUrl}
                onChange={(e) => setMenuUrl(e.target.value)}
                placeholder="https://example.com/menu.pdf or https://example.com/menu.jpg"
                required
              />
              <small className="form-help">
                Enter the URL of the menu file (PDF, image, or any accessible URL)
              </small>
            </div>

            {selectedRestaurant && restaurants.find(r => r._id === selectedRestaurant)?.menu && (
              <div className="current-menu">
                <p>Current Menu:</p>
                <a
                  href={restaurants.find(r => r._id === selectedRestaurant).menu}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="menu-link"
                >
                  View Current Menu
                </a>
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="save-btn" disabled={loading}>
                {loading ? "Uploading..." : "📤 Upload Menu"}
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  setSelectedRestaurant("");
                  setMenuUrl("");
                }}
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        <div className="menu-instructions">
          <h3>Instructions:</h3>
          <ul>
            <li>Select a restaurant from the dropdown</li>
            <li>Enter the URL of the menu file (PDF, image, or document)</li>
            <li>The menu URL will be saved and can be accessed by users</li>
            <li>You can update the menu URL at any time</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default AdminMenuUpload;

