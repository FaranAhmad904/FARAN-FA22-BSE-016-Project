import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api";
import { IMAGE_BASE_URL } from "../config/api";
import "../styles/AdminDashboard.css";
import LocationPicker from "../components/LocationPicker";

const AdminRestaurants = ({ onLogout, darkMode, onToggleTheme, isAdmin }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    cuisine: "",
    menu: "",
    image: "",
    imageFile: null,
    featured: false,
    subscriptionPlan: "free",
    latitude: null,
    longitude: null
  });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRestaurants();
    const action = searchParams.get("action");
    const editId = searchParams.get("edit");
    if (action === "add") {
      setShowForm(true);
    } else if (editId) {
      handleEdit(editId);
    }
  }, [searchParams]);

  useEffect(() => {}, []);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/restaurants");
      setRestaurants(res.data);
    } catch (err) {
      console.error("Error fetching restaurants:", err);
      alert("Failed to load restaurants.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id) => {
    try {
      const restaurant = restaurants.find(r => r._id === id);
      if (restaurant) {
        setEditingRestaurant(restaurant);
        setFormData({
          name: restaurant.name,
          city: restaurant.city,
          cuisine: restaurant.cuisine || "",
          menu: restaurant.menu || "",
          image: restaurant.image || "",
          imageFile: null,
          featured: restaurant.featured || false,
          subscriptionPlan: restaurant.subscriptionPlan || "free",
          latitude: restaurant.latitude || null,
          longitude: restaurant.longitude || null
        });
        setShowForm(true);
      }
    } catch (err) {
      console.error("Error loading restaurant:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('city', formData.city);
      submitData.append('cuisine', formData.cuisine);
      submitData.append('menu', formData.menu);
      submitData.append('featured', formData.featured);
      submitData.append('subscriptionPlan', formData.subscriptionPlan);
      submitData.append('latitude', formData.latitude);
      submitData.append('longitude', formData.longitude);
      
      console.log("DEBUG: FormData being submitted:");
      for (let [key, value] of submitData.entries()) {
        console.log(key, value);
      }
      
      if (formData.imageFile) {
        submitData.append('image', formData.imageFile);
        console.log("DEBUG: Image file being submitted:", formData.imageFile.name);
      } else {
        console.log("DEBUG: No image file in formData");
      }

      if (editingRestaurant) {
        await api.put(
          `/api/admin/restaurants/${editingRestaurant._id}`,
          submitData,
          {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "multipart/form-data"
            }
          }
        );
        alert("✅ Restaurant updated successfully!");
      } else {
        await api.post(
          "/api/admin/restaurants",
          submitData,
          {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "multipart/form-data"
            }
          }
        );
        alert("✅ Restaurant created successfully!");
      }
      setShowForm(false);
      setEditingRestaurant(null);
      setFormData({ 
        name: "", 
        city: "", 
        cuisine: "", 
        menu: "", 
        image: "",
        imageFile: null,
        featured: false, 
        subscriptionPlan: "free", 
        latitude: null, 
        longitude: null 
      });
      fetchRestaurants();
    } catch (err) {
      console.error("Error saving restaurant:", err);
      alert("❌ Failed to save restaurant. Check console for details.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this restaurant?")) return;
    
    try {
      await api.delete(`/api/admin/restaurants/${id}`);
      alert("✅ Restaurant deleted successfully!");
      fetchRestaurants();
    } catch (err) {
      console.error("Error deleting restaurant:", err);
      alert("❌ Failed to delete restaurant.");
    }
  };

  return (
    <div className={`admin-container ${darkMode ? "dark-mode" : "light-mode"}`}>
      <header className="admin-header">
        <div className="header-top">
          <h1>🏪 Restaurant Management</h1>
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
          <h2>Manage Restaurants</h2>
          <button className="add-btn" onClick={() => {
            setShowForm(true);
            setEditingRestaurant(null);
            setFormData({ 
        name: "", 
        city: "", 
        cuisine: "", 
        menu: "", 
        image: "",
        imageFile: null,
        featured: false, 
        subscriptionPlan: "free", 
        latitude: null, 
        longitude: null 
      });
          }}>
            ➕ Add New Restaurant
          </button>
        </div>

        {showForm && (
          <div className="form-modal">
            <div className="form-content">
              <h3>{editingRestaurant ? "Edit Restaurant" : "Add New Restaurant"}</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Restaurant Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Cuisine</label>
                  <select
                    value={formData.cuisine}
                    onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                  >
                    <option value="">Select Cuisine</option>
                    <option value="BBQ">BBQ</option>
                    <option value="Fast Food">Fast Food</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Pakistani">Pakistani</option>
                    <option value="Italian">Italian</option>
                    <option value="Continental">Continental</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>📷 Restaurant Image (will be displayed on homepage)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setFormData({ ...formData, imageFile: file });
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          setFormData(prev => ({ ...prev, image: e.target.result }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {formData.image && (
                    <div className="image-preview">
                      <img src={formData.image.startsWith('http') ? formData.image : `${IMAGE_BASE_URL}${formData.image}`} alt="Restaurant preview" />
                      <p className="image-preview-text">Restaurant image preview</p>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Menu URL</label>
                  <input
                    type="text"
                    value={formData.menu}
                    onChange={(e) => setFormData({ ...formData, menu: e.target.value })}
                    placeholder="https://example.com/menu.pdf"
                  />
                </div>
                
                <div className="form-group">
                  <label>Location (Select on Map) *</label>
                  <LocationPicker 
                    latitude={formData.latitude}
                    longitude={formData.longitude}
                    onLocationSelect={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })}
                  />
                  {formData.latitude && formData.longitude && (
                    <small style={{display: 'block', marginTop: '5px', color: '#666'}}>
                      Selected: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label>Subscription Plan *</label>
                  <select
                    value={formData.subscriptionPlan}
                    onChange={(e) => setFormData({ ...formData, subscriptionPlan: e.target.value })}
                    required
                  >
                    <option value="free">Free</option>
                    <option value="basic">Basic (Paid)</option>
                    <option value="premium">Premium (Paid)</option>
                  </select>
                  <small className="form-help">
                    Paid plans (Basic/Premium) allow restaurants to feature their deals
                  </small>
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    />
                    Featured Restaurant
                  </label>
                </div>
                <div className="form-actions">
                  <button type="submit" className="save-btn">
                    {editingRestaurant ? "Update" : "Create"}
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setShowForm(false);
                      setEditingRestaurant(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading restaurants...</p>
          </div>
        ) : (
          <div className="restaurants-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>City</th>
                  <th>Cuisine</th>
                  <th>Deals</th>
                  <th>Plan</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.length > 0 ? (
                  restaurants.map((restaurant) => (
                    <tr key={restaurant._id}>
                      <td>{restaurant.name}</td>
                      <td>{restaurant.city}</td>
                      <td>{restaurant.cuisine || "N/A"}</td>
                      <td>{restaurant.deals?.length || 0}</td>
                      <td>
                        <span className={`plan-badge ${restaurant.subscriptionPlan || 'free'}`}>
                          {(restaurant.subscriptionPlan || 'free').charAt(0).toUpperCase() + (restaurant.subscriptionPlan || 'free').slice(1)}
                        </span>
                      </td>
                      <td>{restaurant.featured ? "⭐" : "-"}</td>
                      <td>
                        <button
                          className="edit-btn"
                          onClick={() => handleEdit(restaurant._id)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(restaurant._id)}
                        >
                          🗑️ Delete
                        </button>
                        <button
                          className="deals-btn"
                          onClick={() => navigate(`/admin/deals?restaurant=${restaurant._id}`)}
                        >
                          🎯 Deals
                        </button>
                        {isAdmin && restaurant.latitude && restaurant.longitude && (
                          <button
                            className="location-btn"
                            onClick={() => window.open(`https://www.google.com/maps?q=${restaurant.latitude},${restaurant.longitude}`, '_blank')}
                            title="View on Google Maps"
                          >
                            📍 Location
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="no-data">No restaurants found. Add your first restaurant!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminRestaurants;

