import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api";
import { IMAGE_BASE_URL } from "../config/api";
import "../styles/AdminDashboard.css";

const AdminDeals = ({ onLogout, darkMode, onToggleTheme }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [deals, setDeals] = useState([]);
  const [selectedRestaurantData, setSelectedRestaurantData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    price: "",
    validTill: "",
    featured: false,
    spiceLevel: "",
    dietary: "none",
    cuisine: "",
    dealType: "",
    startTime: "",
    endTime: "",
    isActive: true
  });
  const [imageOption, setImageOption] = useState("link"); // "link" or "upload"
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRestaurants();
    const restaurantId = searchParams.get("restaurant");
    const action = searchParams.get("action");
    if (restaurantId) {
      setSelectedRestaurant(restaurantId);
      fetchDeals(restaurantId);
    }
    if (action === "add" && restaurantId) {
      setShowForm(true);
    }
  }, [searchParams]);

  useEffect(() => {}, []);

  const fetchRestaurants = async () => {
    try {
      const res = await api.get("/api/admin/restaurants");
      setRestaurants(res.data);
    } catch (err) {
      console.error("Error fetching restaurants:", err);
    }
  };

  const fetchDeals = async (restaurantId) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/restaurants`);
      const restaurant = res.data.find(r => r._id === restaurantId);
      if (restaurant) {
        setDeals(restaurant.deals || []);
        setSelectedRestaurantData(restaurant);
      }
    } catch (err) {
      console.error("Error fetching deals:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestaurantChange = (e) => {
    const restaurantId = e.target.value;
    setSelectedRestaurant(restaurantId);
    if (restaurantId) {
      fetchDeals(restaurantId);
    } else {
      setDeals([]);
    }
  };

  const handleEdit = (deal) => {
    setEditingDeal(deal);
    setFormData({
      title: deal.title,
      description: deal.description || "",
      image: deal.image || "",
      price: deal.price,
      validTill: deal.validTill ? new Date(deal.validTill).toISOString().split('T')[0] : "",
      featured: deal.featured || false,
      spiceLevel: deal.spiceLevel || "",
      dietary: deal.dietary || "none",
      cuisine: deal.cuisine || "",
      dealType: deal.dealType || "",
      startTime: deal.startTime ? new Date(deal.startTime).toISOString().slice(0,16) : "",
      endTime: deal.endTime ? new Date(deal.endTime).toISOString().slice(0,16) : "",
      isActive: Boolean(deal.isActive)
    });
    setImageOption(deal.image && deal.image.startsWith(`${IMAGE_BASE_URL}/uploads`) ? "upload" : "link");
    setImagePreview(deal.image || null);
    setSelectedFile(null);
    setShowForm(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile) {
      alert("Please select an image file first!");
      return null;
    }

    setUploadingImage(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("image", selectedFile);

      const res = await api.post(
        "/api/admin/upload-image",
        uploadFormData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Image upload response:", res.data);
      let imageUrl = null;
      if (res.data.success) {
        imageUrl = res.data.imageUrl.startsWith('http') ? 
          res.data.imageUrl : `${IMAGE_BASE_URL}${res.data.imageUrl}`;
        setImagePreview(imageUrl);
      }
      if (!imageUrl) {
        throw new Error("No image URL returned from server");
      }

      // Update formData with the image URL
      setFormData((prev) => {
        const updated = { ...prev, image: imageUrl };
        console.log("Updated formData with image URL:", updated);
        return updated;
      });
      setImagePreview(imageUrl);
      alert("✅ Image uploaded successfully! URL: " + imageUrl);
      return imageUrl; // Return the image URL
    } catch (err) {
      console.error("Error uploading image:", err);
      alert("❌ Failed to upload image. Check console for details.");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRestaurant) {
      alert("Please select a restaurant first!");
      return;
    }

    // Check if image is required but not provided
    if (imageOption === "upload" && !formData.image && !selectedFile) {
      alert("Please upload an image or switch to link option!");
      return;
    }

    // If upload option is selected but image not uploaded yet, auto-upload it
    let finalImageUrl = formData.image;
    if (imageOption === "upload" && selectedFile && !formData.image) {
      console.log("Auto-uploading image before form submission...");
      const uploadedImageUrl = await handleImageUpload();
      if (uploadedImageUrl) {
        finalImageUrl = uploadedImageUrl;
        // Update formData state
        setFormData((prev) => ({ ...prev, image: uploadedImageUrl }));
      } else {
        alert("❌ Failed to upload image. Please try again.");
        return;
      }
      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Final check - ensure we have the image URL if upload option was selected
    if (imageOption === "upload" && !finalImageUrl) {
      alert("❌ Please upload the image first before submitting!");
      return;
    }

    // Prepare the data to send - use finalImageUrl to ensure we have the latest value
    const dealData = {
      title: formData.title,
      description: formData.description || "",
      image: finalImageUrl || formData.image || "",
      price: parseFloat(formData.price),
      validTill: formData.validTill || undefined,
      featured: formData.featured || false,
      spiceLevel: formData.spiceLevel ? parseInt(formData.spiceLevel) : null,
      dietary: formData.dietary || null,
      cuisine: formData.cuisine || null,
      dealType: formData.dealType || undefined,
      startTime: formData.startTime || undefined,
      endTime: formData.endTime || undefined,
      isActive: formData.isActive || false
    };

    console.log("Submitting deal with data:", dealData);
    console.log("Image URL being sent:", dealData.image);
    console.log("Final image URL:", finalImageUrl);

    try {
      if (editingDeal) {
        // Ensure deal ID is a string
        const dealId = editingDeal._id ? (typeof editingDeal._id === 'string' ? editingDeal._id : editingDeal._id.toString()) : null;
        if (!dealId) {
          alert("❌ Error: Deal ID is missing");
          return;
        }
        
        const response = await api.put(
          `/api/admin/restaurants/${selectedRestaurant}/deals/${dealId}`,
          dealData,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          }
        );
        console.log("Update response:", response.data);
        alert("✅ Deal updated successfully!");
      } else {
        const response = await api.post(
          `/api/admin/restaurants/${selectedRestaurant}/deals`,
          dealData,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          }
        );
        console.log("Create response:", response.data);
        alert("✅ Deal created successfully!");
      }
      setShowForm(false);
      setEditingDeal(null);
      setFormData({ title: "", description: "", image: "", price: "", validTill: "", featured: false, spiceLevel: "", dietary: "none", cuisine: "", dealType: "", startTime: "", endTime: "", isActive: true });
      setImageOption("link");
      setSelectedFile(null);
      setImagePreview(null);
      fetchDeals(selectedRestaurant);
    } catch (err) {
      console.error("Error saving deal:", err);
      const errorMessage = err.response?.data?.message || "Failed to save deal. Check console for details.";
      alert(`❌ ${errorMessage}`);
    }
  };

  const handleDelete = async (dealId) => {
    if (!dealId) {
      console.error("No deal ID provided for deletion");
      alert("❌ Error: No deal ID found");
      return;
    }

    // Convert to string if it's an object
    const dealIdStr = typeof dealId === 'object' ? dealId.toString() : String(dealId);
    
    if (!window.confirm("Are you sure you want to delete this deal?")) return;
    
    if (!selectedRestaurant) {
      alert("❌ Error: No restaurant selected");
      return;
    }

    try {
      console.log(`Attempting to delete deal ${dealIdStr} from restaurant ${selectedRestaurant}`);
      const response = await api.delete(
        `/api/admin/restaurants/${selectedRestaurant}/deals/${dealIdStr}`
      );
      console.log("Delete response:", response.data);
      alert("✅ Deal deleted successfully!");
      fetchDeals(selectedRestaurant);
    } catch (err) {
      console.error("Error deleting deal:", err);
      console.error("Error details:", err.response?.data);
      alert(`❌ Failed to delete deal: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className={`admin-container ${darkMode ? "dark-mode" : "light-mode"}`}>
      <header className="admin-header">
        <div className="header-top">
          <h1>🎯 Deal Management</h1>
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
          <h2>Manage Deals</h2>
          <div className="restaurant-selector">
            <label>Select Restaurant:</label>
            <select
              value={selectedRestaurant || ""}
              onChange={handleRestaurantChange}
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
        </div>

        {selectedRestaurant && (
          <>
            <div className="page-header">
              <button
                className="add-btn"
                  onClick={() => {
                  setShowForm(true);
                  setEditingDeal(null);
                  setFormData({ title: "", description: "", image: "", price: "", validTill: "", featured: false, spiceLevel: "", dietary: "none", cuisine: "", dealType: "", startTime: "", endTime: "", isActive: true });
                  setImageOption("link");
                  setSelectedFile(null);
                  setImagePreview(null);
                }}
              >
                ➕ Create New Deal
              </button>
            </div>

            {showForm && (
              <div className="form-modal">
                <div className="form-content">
                  <h3>{editingDeal ? "Edit Deal" : "Create New Deal"}</h3>
                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label>Deal Title *</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows="3"
                      />
                    </div>
                    <div className="form-group">
                      <label>Deal Image</label>
                      <div className="image-option-selector">
                        <label className="radio-label">
                          <input
                            type="radio"
                            value="link"
                            checked={imageOption === "link"}
                            onChange={(e) => {
                              setImageOption(e.target.value);
                              setSelectedFile(null);
                              setImagePreview(null);
                            }}
                          />
                          <span>Paste Image Link</span>
                        </label>
                        <label className="radio-label">
                          <input
                            type="radio"
                            value="upload"
                            checked={imageOption === "upload"}
                            onChange={(e) => {
                              setImageOption(e.target.value);
                              setFormData({ ...formData, image: "" });
                            }}
                          />
                          <span>Upload from Computer</span>
                        </label>
                      </div>

                      {imageOption === "link" ? (
                        <div>
                          <input
                            type="text"
                            value={formData.image}
                            onChange={(e) => {
                              setFormData({ ...formData, image: e.target.value });
                              setImagePreview(e.target.value || null);
                            }}
                            placeholder="https://example.com/image.jpg, .png, .gif, .webp, etc."
                          />
                          <small className="form-help">
                            Supports all image formats: JPG, PNG, GIF, WEBP, SVG, BMP, TIFF, ICO
                          </small>
                        </div>
                      ) : (
                        <div className="upload-section">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="file-input"
                            id="image-upload"
                          />
                          <label htmlFor="image-upload" className="file-label">
                            📁 Choose Image File
                          </label>
                          {selectedFile && (
                            <div className="upload-actions">
                              <button
                                type="button"
                                className="upload-btn"
                                onClick={handleImageUpload}
                                disabled={uploadingImage}
                              >
                                {uploadingImage ? "⏳ Uploading..." : "📤 Upload Image"}
                              </button>
                              <span className="file-name">{selectedFile.name}</span>
                            </div>
                          )}
                          <small className="form-help">
                            Supported formats: JPG, PNG, GIF, WEBP, SVG, BMP, TIFF, ICO (Max 10MB)
                          </small>
                        </div>
                      )}

                      {imagePreview && (
                        <div className="image-preview">
                          <img src={imagePreview} alt="Preview" />
                          <button
                            type="button"
                            className="remove-preview-btn"
                            onClick={() => {
                              setImagePreview(null);
                              setFormData({ ...formData, image: "" });
                              setSelectedFile(null);
                            }}
                          >
                            ❌ Remove
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Price (Rs.) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                      />
                    </div>
                  <div className="form-group">
                    <label>Time Slot</label>
                    <select
                      value={formData.dealType}
                      onChange={(e) => setFormData({ ...formData, dealType: e.target.value })}
                    >
                      <option value="">Select Time Slot</option>
                      <option value="day">Day</option>
                      <option value="night">Night</option>
                      <option value="midnight">Midnight</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Start Date & Time</label>
                    <input
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Expiry Date & Time</label>
                    <input
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    />
                  </div>
                    <div className="form-group">
                      <label>Valid Till</label>
                      <input
                        type="date"
                        value={formData.validTill}
                        onChange={(e) => setFormData({ ...formData, validTill: e.target.value })}
                      />
                    </div>
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      />
                      <span>Manually Activate</span>
                    </label>
                  </div>
                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.featured}
                          onChange={(e) => {
                            const isFeatured = e.target.checked;
                            if (isFeatured && selectedRestaurantData?.subscriptionPlan === 'free') {
                              alert("⚠️ Featured deals require a paid subscription plan (Basic or Premium). Please upgrade the restaurant's subscription plan first.");
                              return;
                            }
                            setFormData({ ...formData, featured: isFeatured });
                          }}
                        />
                        <span>⭐ Mark as Featured Deal</span>
                        {selectedRestaurantData?.subscriptionPlan && (
                          <small className="form-help">
                            Current Plan: {selectedRestaurantData.subscriptionPlan.charAt(0).toUpperCase() + selectedRestaurantData.subscriptionPlan.slice(1)}
                            {selectedRestaurantData.subscriptionPlan === 'free' && " (Upgrade required for featured deals)"}
                          </small>
                        )}
                      </label>
                    </div>

                    {/* AI Recommendation Fields */}
                    <div className="form-group" style={{ marginTop: "24px", paddingTop: "24px", borderTop: "2px solid #e0e0e0" }}>
                      <h4 style={{ marginBottom: "16px", color: "#d70f64" }}>🤖 AI Recommendation Settings (Optional)</h4>
                      <small style={{ display: "block", marginBottom: "16px", color: "#666" }}>
                        These fields help the AI recommendation system provide better matches. Leave empty to use restaurant defaults.
                      </small>
                      
                      <div className="form-group">
                        <label>Spice Level (1-5)</label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={formData.spiceLevel}
                          onChange={(e) => setFormData({ ...formData, spiceLevel: e.target.value })}
                          placeholder="Leave empty to use restaurant default"
                        />
                        <small className="form-help">1 = Mild, 5 = Very Spicy</small>
                      </div>

                      <div className="form-group">
                        <label>Dietary Preference</label>
                        <select
                          value={formData.dietary}
                          onChange={(e) => setFormData({ ...formData, dietary: e.target.value })}
                        >
                          <option value="none">None (Use Restaurant Default)</option>
                          <option value="vegetarian">Vegetarian</option>
                          <option value="halal">Halal</option>
                          <option value="vegan">Vegan</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Cuisine Type</label>
                        <input
                          type="text"
                          value={formData.cuisine}
                          onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                          placeholder="Leave empty to use restaurant cuisine"
                          list="cuisine-list"
                        />
                        <datalist id="cuisine-list">
                          <option value="Pakistani" />
                          <option value="BBQ" />
                          <option value="Chinese" />
                          <option value="Fast Food" />
                          <option value="Italian" />
                          <option value="Thai" />
                          <option value="Indian" />
                        </datalist>
                        <small className="form-help">If this deal has a different cuisine than the restaurant</small>
                      </div>
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="save-btn">
                        {editingDeal ? "Update" : "Create"}
                      </button>
                      <button
                        type="button"
                        className="cancel-btn"
                        onClick={() => {
                          setShowForm(false);
                          setEditingDeal(null);
                      setFormData({ title: "", description: "", image: "", price: "", validTill: "", featured: false, spiceLevel: "", dietary: "none", cuisine: "", dealType: "", startTime: "", endTime: "", isActive: false });
                          setImageOption("link");
                          setSelectedFile(null);
                          setImagePreview(null);
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
                <p>Loading deals...</p>
              </div>
            ) : (
              <div className="deals-grid">
                {deals.length > 0 ? (
                  deals.map((deal) => {
                    // Ensure we have a valid deal ID
                    const dealId = deal._id ? (typeof deal._id === 'string' ? deal._id : deal._id.toString()) : null;
                    // Ensure we have a valid image URL - only show if image exists and is not empty
                    const imageUrl = deal.image && deal.image.trim() !== "" ? 
                      (deal.image.startsWith('http') ? deal.image : `${IMAGE_BASE_URL}${deal.image}`) : null;
                    
                    return (
                      <div key={dealId || Math.random()} className="deal-card-admin">
                        <div className="deal-image-container">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={deal.title}
                              onError={(e) => {
                                // If image fails to load, hide it and show placeholder
                                e.target.style.display = 'none';
                                const placeholder = e.target.parentElement.querySelector('.no-image-placeholder');
                                if (placeholder) placeholder.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          {!imageUrl && (
                            <div className="no-image-placeholder">
                              <span>📷 No Image</span>
                            </div>
                          )}
                        </div>
                        <div className="deal-content">
                          <div className="deal-header">
                            <h4>{deal.title}</h4>
                            {deal.dealType ? (
                              <span className="type-badge-admin">
                                {deal.dealType.charAt(0).toUpperCase() + deal.dealType.slice(1)}
                              </span>
                            ) : deal.featured && (
                              <span className="featured-badge-admin">⭐ Featured</span>
                            )}
                          </div>
                          <p>{deal.description}</p>
                          <div className="deal-info">
                            <span>💰 Rs. {deal.price}</span>
                            {deal.validTill && (
                              <span>📅 {new Date(deal.validTill).toLocaleDateString()}</span>
                            )}
                          </div>
                          <div className="deal-actions">
                            <button
                              className="edit-btn"
                              onClick={() => handleEdit(deal)}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              className="delete-btn"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log("Deleting deal with ID:", dealId, "Type:", typeof dealId);
                                if (dealId) {
                                  handleDelete(dealId);
                                } else {
                                  alert("❌ Error: Deal ID is missing");
                                }
                              }}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="no-data">No deals found for this restaurant. Create your first deal!</p>
                )}
              </div>
            )}
          </>
        )}

        {!selectedRestaurant && (
          <div className="no-selection">
            <p>Please select a restaurant to manage its deals.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDeals;
