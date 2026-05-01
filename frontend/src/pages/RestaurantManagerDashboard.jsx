import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "../styles/AdminDashboard.css";

const RestaurantManagerDashboard = ({ onLogout, darkMode, onToggleTheme }) => {
  const [restaurant, setRestaurant] = useState(null);
  const [deals, setDeals] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [showAiInsights, setShowAiInsights] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRestaurantForm, setShowRestaurantForm] = useState(false);
  const [showDealForm, setShowDealForm] = useState(false);
  const [restaurantForm, setRestaurantForm] = useState({
    name: "",
    city: "",
    cuisine: "",
    image: "",
    menu: ""
  });
  const [dealForm, setDealForm] = useState({
    title: "",
    description: "",
    price: "",
    image: "",
    validTill: "",
    dealType: "",
    startTime: "",
    endTime: "",
    spiceLevel: "",
    dietary: "",
    cuisine: ""
  });
  const [imageOption, setImageOption] = useState("link"); // "link" or "upload"
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const navigate = useNavigate();
  const scrollToDeals = () => {
    const el = document.getElementById('deals-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const scrollToAi = () => {
    const el = document.getElementById('ai-insights');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const totalDeals = deals.length;
  const approvedDeals = deals.filter((deal) => deal.status === "approved").length;
  const pendingDeals = deals.filter((deal) => deal.status === "pending").length;
  const rejectedDeals = deals.filter((deal) => deal.status === "rejected").length;

  useEffect(() => {
    fetchRestaurant();
    fetchDeals();
    fetchAnalytics();
    fetchAiInsights();
    const interval = setInterval(() => {
      fetchAiInsights();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get("http://localhost:7000/api/manager/analytics", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.data.success) {
        setAnalytics(res.data.analytics);
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
    }
  };

  const fetchAiInsights = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const city = restaurant?.city || "";
      const url = city
        ? `http://localhost:7001/api/manager/ai-insights?city=${encodeURIComponent(city)}`
        : `http://localhost:7001/api/manager/ai-insights`;
      const res = await axios.get(url);
      if (res.data?.success) {
        setAiInsights(res.data.data);
      } else {
        setAiError("AI service returned an error");
      }
    } catch (err) {
      setAiError("AI service unavailable");
    } finally {
      setAiLoading(false);
    }
  };

  const fetchRestaurant = async () => {
    try {
      const res = await axios.get("http://localhost:7000/api/manager/restaurant", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.data.success) {
        setRestaurant(res.data.restaurant);
        setRestaurantForm({
          name: res.data.restaurant.name || "",
          city: res.data.restaurant.city || "",
          cuisine: res.data.restaurant.cuisine || "",
          image: res.data.restaurant.image || "",
          menu: res.data.restaurant.menu || ""
        });
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error("Error fetching restaurant:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDeals = async () => {
    try {
      const res = await axios.get("http://localhost:7000/api/manager/deals", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.data.success) {
        setDeals(res.data.deals || []);
      }
    } catch (err) {
      console.error("Error fetching deals:", err);
    }
  };

  const handleRestaurantSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', restaurantForm.name);
      formData.append('city', restaurantForm.city);
      formData.append('cuisine', restaurantForm.cuisine);
      formData.append('menu', restaurantForm.menu);
      
      if (restaurantForm.imageFile) {
        formData.append('image', restaurantForm.imageFile);
      }

      if (restaurant) {
        // Update existing restaurant
        const res = await axios.put(
          "http://localhost:7000/api/manager/restaurant",
          formData,
          { 
            headers: { 
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "multipart/form-data"
            } 
          }
        );
        if (res.data.success) {
          alert(res.data.message || "Restaurant updated successfully!");
          setRestaurant(res.data.restaurant);
          setShowRestaurantForm(false);
        }
      } else {
        // Register new restaurant
        const res = await axios.post(
          "http://localhost:7000/api/manager/restaurant/register",
          formData,
          { 
            headers: { 
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "multipart/form-data"
            } 
          }
        );
        if (res.data.success) {
          alert(res.data.message || "Restaurant registered successfully!");
          setRestaurant(res.data.restaurant);
          setShowRestaurantForm(false);
        }
      }
    } catch (err) {
      console.error("Error saving restaurant:", err);
      alert("Failed to save restaurant. Please try again.");
    }
  };

  const handleImageUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await axios.post(
        "http://localhost:7000/api/manager/upload-image",
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );
      if (res.data.success) {
        return res.data.imageUrl;
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      alert("Error uploading image");
    }
    return null;
  };

  const handleDealSubmit = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = dealForm.image;

      if (imageOption === "upload" && selectedFile) {
        setUploadingImage(true);
        imageUrl = await handleImageUpload(selectedFile);
        setUploadingImage(false);

        if (!imageUrl) {
          alert("Error uploading image");
          return;
        }
      } else if (imageOption === "upload" && !selectedFile) {
        imageUrl = "";
      }

      const dealData = {
        ...dealForm,
        image: imageUrl,
        price: parseFloat(dealForm.price),
        spiceLevel: dealForm.spiceLevel ? parseInt(dealForm.spiceLevel) : null,
        validTill: dealForm.validTill || undefined,
        dealType: dealForm.dealType || undefined,
        startTime: dealForm.startTime || undefined,
        endTime: dealForm.endTime || undefined
      };

      const res = await axios.post(
        "http://localhost:7000/api/manager/deals",
        dealData,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (res.data.success) {
        alert(res.data.message || "Deal added successfully!");
        setDealForm({
          title: "",
          description: "",
          price: "",
          image: "",
          validTill: "",
          dealType: "",
          startTime: "",
          endTime: "",
          spiceLevel: "",
          dietary: "",
          cuisine: ""
        });
        setImageOption("link");
        setSelectedFile(null);
        setShowDealForm(false);
        fetchDeals();
      }
    } catch (err) {
      alert("❌ Error: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteDeal = async (dealId) => {
    if (!window.confirm("Are you sure you want to delete this deal?")) return;
    try {
      const res = await axios.delete(
        `http://localhost:7000/api/manager/deals/${dealId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (res.data.success) {
        alert("Deal deleted successfully!");
        fetchDeals();
      }
    } catch (err) {
      alert("❌ Error: " + (err.response?.data?.message || err.message));
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: "⏳ Pending", class: "status-pending" },
      approved: { text: "✅ Approved", class: "status-approved" },
      rejected: { text: "❌ Rejected", class: "status-rejected" }
    };
    return badges[status] || { text: status, class: "" };
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
          <h1>🍽️ Restaurant Manager Dashboard</h1>
          <div className="header-buttons">
            <button
              className="theme-toggle-btn"
              onClick={onToggleTheme}
            >
              {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
            <button
              className="nav-btn"
              onClick={async () => {
                setShowAiInsights(true);
                await fetchAiInsights();
                scrollToAi();
              }}
            >
              🤖 AI Insights
            </button>
            <button className="nav-btn" onClick={() => navigate("/manager/subscription")}>
              💳 Subscription
            </button>
            <button className="logout-btn" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        <div className="manager-actions">
          <button className="action-pill add" onClick={() => { setShowDealForm(true); scrollToDeals(); }}>
            ➕ Add Deal
          </button>
          <button className="action-pill modify" onClick={scrollToDeals}>
            ✏️ Modify Deal
          </button>
          <button className="action-pill view" onClick={scrollToDeals}>
            👁️ View Deals
          </button>
          <button className="action-pill subs" onClick={() => navigate("/manager/subscription")}>
            💳 Manage Subscriptions
          </button>
        </div>
        {restaurant && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🏪</div>
              <div className="stat-info">
                <h3>{restaurant.name || "My Restaurant"}</h3>
                <p>{restaurant.city || "City not set"}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-info">
                <h3>{totalDeals}</h3>
                <p>Total Deals</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>{approvedDeals}</h3>
                <p>Approved Deals</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-info">
                <h3>{pendingDeals}</h3>
                <p>Pending Deals</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">❌</div>
              <div className="stat-info">
                <h3>{rejectedDeals}</h3>
                <p>Rejected Deals</p>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Charts */}
        {analytics && (
          <div className="section-card" style={{ marginBottom: '20px' }}>
            <h2>📊 Performance Analytics</h2>
            
            <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginTop: '20px' }}>
              
              {/* Weekly Performance */}
              <div className="chart-card">
                <h3 style={{ marginBottom: '15px', fontSize: '1.1rem', color: '#666' }}>Weekly Activity</h3>
                <div style={{ height: '300px', width: '100%' }}>
                  <ResponsiveContainer>
                    <BarChart data={analytics.dailyStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ backgroundColor: darkMode ? '#333' : '#fff', borderColor: darkMode ? '#555' : '#ccc', color: darkMode ? '#fff' : '#000' }}
                      />
                      <Legend />
                      <Bar dataKey="views" fill="#8884d8" name="Views" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="clicks" fill="#82ca9d" name="Clicks" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Deals */}
              <div className="chart-card">
                <h3 style={{ marginBottom: '15px', fontSize: '1.1rem', color: '#666' }}>Top Performing Deals</h3>
                <div style={{ height: '300px', width: '100%' }}>
                   <ResponsiveContainer>
                    <BarChart layout="vertical" data={analytics.topDeals} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <XAxis type="number" />
                      <YAxis dataKey="title" type="category" width={100} tick={{fontSize: 12}} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: darkMode ? '#333' : '#fff', borderColor: darkMode ? '#555' : '#ccc', color: darkMode ? '#fff' : '#000' }}
                      />
                      <Legend />
                      <Bar dataKey="views" fill="#d70f64" name="Views" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="clicks" fill="#ff9800" name="Clicks" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
            </div>
          </div>
        )}

        {showAiInsights && (
          <div className="section-card" id="ai-insights" style={{ marginBottom: '20px' }}>
            <h2>🤖 AI Insights</h2>
            {aiLoading && (
              <div className="restaurant-info">
                <p>Loading AI insights...</p>
              </div>
            )}
            {!aiLoading && aiError && (
              <div className="restaurant-info">
                <p className="info-message">Error: {aiError}</p>
              </div>
            )}
            {!aiLoading && !aiError && aiInsights && (
              <div className="restaurant-info">
                <p><strong>City:</strong> {aiInsights.city}</p>
                <p>
                  <strong>Preferred Spice:</strong> {aiInsights.spice_pref?.preferred_spice_level || "N/A"}{" "}
                  <span style={{ marginLeft: 8, fontSize: '0.9rem', color: '#666' }}>
                    ({Math.round((aiInsights.spice_pref?.confidence_score || 0) * 100)}% confidence)
                  </span>
                </p>
                <p>
                  <strong>Price Sensitivity:</strong> {aiInsights.price_sensitivity?.correlation ?? 0}
                </p>
                <p>
                  <strong>Suggestion:</strong> {aiInsights.price_sensitivity?.suggestion}
                </p>
                <p style={{ marginTop: 8 }}>
                  <strong>Summary:</strong> {aiInsights.summary}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Restaurant Section */}
        <div className="section-card">
          <div className="section-header">
            <h2>My Restaurant</h2>
            <button
              className="action-btn"
              onClick={() => setShowRestaurantForm(!showRestaurantForm)}
            >
              {restaurant ? "✏️ Edit Restaurant" : "➕ Register Restaurant"}
            </button>
          </div>

          {restaurant && (
            <div className="restaurant-info">
              <p><strong>Name:</strong> {restaurant.name}</p>
              <p><strong>City:</strong> {restaurant.city}</p>
              <p><strong>Cuisine:</strong> {restaurant.cuisine || "N/A"}</p>
              <p><strong>Status:</strong> 
                <span className={getStatusBadge(restaurant.status).class}>
                  {getStatusBadge(restaurant.status).text}
                </span>
              </p>
              <p><strong>Subscription:</strong> {restaurant.subscriptionPlan || "free"}</p>
              {restaurant.menu && (
                <p>
                  <strong>Menu:</strong> <a href={restaurant.menu} target="_blank" rel="noreferrer">View Menu</a>
                </p>
              )}
            </div>
          )}

          {showRestaurantForm && (
            <form onSubmit={handleRestaurantSubmit} className="form-card">
              <input
                type="text"
                placeholder="Restaurant Name"
                value={restaurantForm.name}
                onChange={(e) => setRestaurantForm({ ...restaurantForm, name: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="City"
                value={restaurantForm.city}
                onChange={(e) => setRestaurantForm({ ...restaurantForm, city: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Cuisine (optional)"
                value={restaurantForm.cuisine}
                onChange={(e) => setRestaurantForm({ ...restaurantForm, cuisine: e.target.value })}
              />
              <div className="image-upload-section">
                <label>📷 Restaurant Image (will be displayed on homepage):</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setRestaurantForm({ ...restaurantForm, imageFile: file });
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        setRestaurantForm(prev => ({ ...prev, image: e.target.result }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                {restaurantForm.image && (
                  <div className="image-preview">
                    <img src={restaurantForm.image} alt="Restaurant preview" />
                    <p className="image-preview-text">Restaurant image preview</p>
                  </div>
                )}
              </div>
              <input
                type="url"
                placeholder="Menu URL (optional)"
                value={restaurantForm.menu}
                onChange={(e) => setRestaurantForm({ ...restaurantForm, menu: e.target.value })}
              />
              <div className="form-buttons">
                <button type="submit">{restaurant ? "Update" : "Register"}</button>
                <button type="button" onClick={() => setShowRestaurantForm(false)}>Cancel</button>
              </div>
            </form>
          )}
        </div>

        {/* Deals Section */}
        {restaurant && restaurant.status === 'approved' && (
          <div className="section-card" id="deals-section">
            <div className="section-header">
              <h2>My Deals</h2>
              <button
                className="action-btn"
                onClick={() => setShowDealForm(!showDealForm)}
              >
                ➕ Add Deal
              </button>
            </div>

            {showDealForm && (
              <form onSubmit={handleDealSubmit} className="form-card">
                <input
                  type="text"
                  placeholder="Deal Title"
                  value={dealForm.title}
                  onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })}
                  required
                />
                <textarea
                  placeholder="Description"
                  value={dealForm.description}
                  onChange={(e) => setDealForm({ ...dealForm, description: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={dealForm.price}
                  onChange={(e) => setDealForm({ ...dealForm, price: e.target.value })}
                  required
                  step="0.01"
                />
                <div style={{ margin: "10px 0", color: "inherit" }}>
                  <label style={{ marginRight: "15px", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="imageOption"
                      checked={imageOption === "link"}
                      onChange={() => setImageOption("link")}
                      style={{ marginRight: "5px" }}
                    />
                    Paste Link
                  </label>
                  <label style={{ cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="imageOption"
                      checked={imageOption === "upload"}
                      onChange={() => setImageOption("upload")}
                      style={{ marginRight: "5px" }}
                    />
                    Upload Image
                  </label>
                </div>

                {imageOption === "link" ? (
                  <input
                    type="url"
                    placeholder="Image URL (optional)"
                    value={dealForm.image}
                    onChange={(e) => setDealForm({ ...dealForm, image: e.target.value })}
                  />
                ) : (
                  <div style={{ marginBottom: "10px" }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          setSelectedFile(e.target.files[0]);
                        }
                      }}
                      style={{ padding: "10px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", width: "100%" }}
                    />
                    {uploadingImage && <p style={{ fontSize: "0.9em", marginTop: "5px" }}>Uploading...</p>}
                  </div>
                )}
                <select
                  value={dealForm.dealType}
                  onChange={(e) => setDealForm({ ...dealForm, dealType: e.target.value })}
                >
                  <option value="">Select Time Slot</option>
                  <option value="day">Day</option>
                  <option value="night">Night</option>
                  <option value="midnight">Midnight</option>
                </select>
                <input
                  type="datetime-local"
                  placeholder="Start Time"
                  value={dealForm.startTime}
                  onChange={(e) => setDealForm({ ...dealForm, startTime: e.target.value })}
                />
                <input
                  type="datetime-local"
                  placeholder="End Time"
                  value={dealForm.endTime}
                  onChange={(e) => setDealForm({ ...dealForm, endTime: e.target.value })}
                />
                <input
                  type="date"
                  placeholder="Valid Till"
                  value={dealForm.validTill}
                  onChange={(e) => setDealForm({ ...dealForm, validTill: e.target.value })}
                />
                <input
                  type="number"
                  min="1"
                  max="5"
                  placeholder="Spice Level (1-5)"
                  value={dealForm.spiceLevel}
                  onChange={(e) => setDealForm({ ...dealForm, spiceLevel: e.target.value })}
                />
                <select
                  value={dealForm.dietary}
                  onChange={(e) => setDealForm({ ...dealForm, dietary: e.target.value })}
                >
                  <option value="">Select Dietary</option>
                  <option value="none">None</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="halal">Halal</option>
                  <option value="vegan">Vegan</option>
                </select>
                <div className="form-buttons">
                  <button type="submit">Add Deal</button>
                  <button type="button" onClick={() => setShowDealForm(false)}>Cancel</button>
                </div>
              </form>
            )}

            <div className="manager-deals-table">
              {deals.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Deal Name</th>
                      <th>Deal Description</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deals.map((deal) => (
                      <tr key={deal._id}>
                        <td>
                          {deal.image ? (
                            <img src={deal.image} alt={deal.title} className="deal-thumb" />
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td>{deal.title}</td>
                        <td>{deal.description || "N/A"}</td>
                        <td>${Number(deal.price).toFixed(2)}</td>
                        <td>
                          <span className={getStatusBadge(deal.status).class}>
                            {getStatusBadge(deal.status).text}
                          </span>
                        </td>
                        <td>
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteDeal(deal._id)}
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-data">No deals yet. Add your first deal!</p>
              )}
            </div>
          </div>
        )}

        {restaurant && restaurant.status !== 'approved' && (
          <div className="section-card">
            <p className="info-message">
              ⏳ Your restaurant is {restaurant.status}. Please wait for admin approval before adding deals.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default RestaurantManagerDashboard;

