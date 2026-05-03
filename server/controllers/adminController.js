// server/controllers/adminController.js
import Restaurant from "../models/Restaurant.js";

// Get dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    const totalRestaurants = restaurants.length;
    const totalDeals = restaurants.reduce((sum, r) => sum + (r.deals?.length || 0), 0);
    const totalCities = new Set(restaurants.map(r => r.city)).size;
    const totalViews = restaurants.reduce((sum, r) => sum + (r.totalViews || 0), 0);
    const totalClicks = restaurants.reduce((sum, r) => sum + (r.totalClicks || 0), 0);
    const conversionRateAvg = totalViews > 0 ? Number(((totalClicks / totalViews) * 100).toFixed(2)) : 0;
    
    // Count pending restaurants
    const pendingRestaurants = restaurants.filter(r => r.status === 'pending').length;
    
    // Count pending deals
    let pendingDeals = 0;
    restaurants.forEach(r => {
      if (r.deals) {
        pendingDeals += r.deals.filter(d => d.status === 'pending').length;
      }
    });
    
    const restaurantViews = restaurants.map(r => ({
      restaurantId: r._id,
      name: r.name,
      views: r.totalViews || 0
    }));
    const restaurantClicks = restaurants.map(r => ({
      restaurantId: r._id,
      name: r.name,
      clicks: r.totalClicks || 0
    }));
    const restaurantConversion = restaurants.map(r => {
      const v = r.totalViews || 0;
      const c = r.totalClicks || 0;
      return {
        restaurantId: r._id,
        name: r.name,
        conversionRate: v > 0 ? Number(((c / v) * 100).toFixed(2)) : 0
      };
    });
    const dealPopularity = [];
    restaurants.forEach(r => {
      (r.deals || []).forEach(d => {
        dealPopularity.push({
          dealId: d._id,
          restaurantId: r._id,
          restaurantName: r.name,
          title: d.title,
          clicks: d.clicks || 0,
          views: d.views || 0
        });
      });
    });
    const topDeals = dealPopularity.sort((a, b) => b.clicks - a.clicks).slice(0, 5);
    
    res.json({
      totalRestaurants,
      totalDeals,
      totalCities,
      totalViews,
      totalClicks,
      conversionRateAvg,
      pendingRestaurants,
      pendingDeals,
      restaurants: restaurants.map(r => ({
        _id: r._id,
        name: r.name,
        city: r.city,
        cuisine: r.cuisine,
        dealsCount: r.deals?.length || 0,
        status: r.status,
        createdAt: r.createdAt
      })),
      analytics: {
        restaurantViews,
        restaurantClicks,
        restaurantConversion,
        topDeals
      }
    });
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    res.status(500).json({ message: "Error fetching dashboard stats" });
  }
};

// Create restaurant
export const createRestaurant = async (req, res) => {
  try {
    const { name, city, cuisine, menu, latitude, longitude } = req.body;
    
    console.log("DEBUG: Create restaurant req.body:", req.body);
    console.log("DEBUG: Create restaurant req.file:", req.file);
    
    if (!name || !city) {
      return res.status(400).json({ message: "Name and city are required" });
    }

    let imageUrl = "";
    
    // Handle image upload
    if (req.file && req.file.path) {
      imageUrl = `/uploads/images/${req.file.filename}`;
      console.log("DEBUG: Image uploaded, path:", imageUrl);
    } else {
      console.log("DEBUG: No image file uploaded");
    }

    // Handle latitude and longitude properly from FormData
    let parsedLatitude = null;
    let parsedLongitude = null;
    
    if (latitude !== undefined) {
      if (latitude !== "null" && latitude !== null && latitude !== "") {
        parsedLatitude = parseFloat(latitude);
      }
    }
    
    if (longitude !== undefined) {
      if (longitude !== "null" && longitude !== null && longitude !== "") {
        parsedLongitude = parseFloat(longitude);
      }
    }

    const restaurant = new Restaurant({ 
      name, 
      city, 
      cuisine, 
      menu, 
      image: imageUrl,
      latitude: parsedLatitude, 
      longitude: parsedLongitude, 
      status: 'approved' 
    });
    
    console.log("DEBUG: Restaurant object before save:", restaurant);
    await restaurant.save();
    console.log("DEBUG: Restaurant saved with image:", restaurant.image);
    
    res.status(201).json({ success: true, restaurant });
  } catch (err) {
    console.error("Error creating restaurant:", err);
    res.status(500).json({ message: "Error creating restaurant: " + err.message });
  }
};

// Update restaurant
export const updateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, city, cuisine, menu, featured, subscriptionPlan, latitude, longitude } = req.body;
    
    console.log("DEBUG: Update restaurant req.body:", req.body);
    console.log("DEBUG: Update restaurant req.file:", req.file);
    
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    console.log("DEBUG: Current restaurant image:", restaurant.image);

    if (name) restaurant.name = name;
    if (city) restaurant.city = city;
    if (cuisine !== undefined) restaurant.cuisine = cuisine;
    if (menu !== undefined) restaurant.menu = menu;
    
    // Handle latitude and longitude properly from FormData
    if (latitude !== undefined) {
      if (latitude === "null" || latitude === null || latitude === "") {
        restaurant.latitude = null;
      } else {
        restaurant.latitude = parseFloat(latitude);
      }
    }
    
    if (longitude !== undefined) {
      if (longitude === "null" || longitude === null || longitude === "") {
        restaurant.longitude = null;
      } else {
        restaurant.longitude = parseFloat(longitude);
      }
    }
    
    if (featured !== undefined) restaurant.featured = featured;
    
    // Handle image upload
    if (req.file && req.file.path) {
      restaurant.image = `/uploads/images/${req.file.filename}`;
      console.log("DEBUG: New image uploaded, path:", restaurant.image);
    } else {
      console.log("DEBUG: No new image uploaded, keeping existing:", restaurant.image);
    }
    
    if (subscriptionPlan !== undefined) {
      // Validate subscription plan
      if (['free', 'basic', 'premium'].includes(subscriptionPlan)) {
        restaurant.subscriptionPlan = subscriptionPlan;
        // If downgrading to free, remove featured status from all deals
        if (subscriptionPlan === 'free') {
          restaurant.deals.forEach(deal => {
            deal.featured = false;
          });
        }
      }
    }

    console.log("DEBUG: Restaurant object before save:", restaurant);
    await restaurant.save();
    console.log("DEBUG: Restaurant saved with image:", restaurant.image);
    res.json({ success: true, restaurant });
  } catch (err) {
    console.error("Error updating restaurant:", err);
    res.status(500).json({ message: "Error updating restaurant: " + err.message });
  }
};

// Delete restaurant
export const deleteRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findByIdAndDelete(id);
    
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    
    res.json({ success: true, message: "Restaurant deleted successfully" });
  } catch (err) {
    console.error("Error deleting restaurant:", err);
    res.status(500).json({ message: "Error deleting restaurant: " + err.message });
  }
};

// Get all restaurants (admin view)
export const getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find().sort({ createdAt: -1 });
    res.json(restaurants);
  } catch (err) {
    console.error("Error fetching restaurants:", err);
    res.status(500).json({ message: "Error fetching restaurants" });
  }
};

// Create deal for a restaurant
export const createDeal = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { title, description, image, price, validTill, featured, spiceLevel, dietary, cuisine, dealType, startTime, endTime, isActive } = req.body;
    
    console.log("Creating deal with data:", { title, description, image, price, validTill, featured, spiceLevel, dietary, cuisine });
    console.log("Image URL received:", image);
    
    if (!title || !price) {
      return res.status(400).json({ message: "Title and price are required" });
    }
    if (dealType && !["day", "night", "midnight"].includes(dealType)) {
      return res.status(400).json({ message: "Invalid dealType" });
    }
    if (startTime && endTime) {
      const s = new Date(startTime);
      const e = new Date(endTime);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) {
        return res.status(400).json({ message: "Invalid startTime or endTime" });
      }
      if (e <= s) {
        return res.status(400).json({ message: "endTime must be after startTime" });
      }
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Validate featured deal based on subscription plan
    const isFeatured = featured === true || featured === 'true';
    if (isFeatured && restaurant.subscriptionPlan === 'free') {
      return res.status(403).json({ 
        message: "Featured deals require a paid subscription plan. Please upgrade to Basic or Premium plan." 
      });
    }

    // Validate spice level if provided
    if (spiceLevel !== undefined && spiceLevel !== null) {
      const spice = parseInt(spiceLevel);
      if (isNaN(spice) || spice < 1 || spice > 5) {
        return res.status(400).json({ message: "Spice level must be between 1 and 5" });
      }
    }

    const deal = {
      title,
      description: description || "",
      image: image || "",
      price,
      validTill: validTill ? new Date(validTill) : undefined,
      featured: isFeatured,
      dealType: dealType || null,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      isActive: Boolean(isActive),
      status: 'approved',
      spiceLevel: spiceLevel !== undefined && spiceLevel !== null ? parseInt(spiceLevel) : null,
      dietary: dietary || null,
      cuisine: cuisine || null,
      reviews: []
    };

    console.log("Deal object to be saved:", deal);

    restaurant.deals.push(deal);
    await restaurant.save();
    
    const savedDeal = restaurant.deals[restaurant.deals.length - 1];
    console.log("Deal saved successfully. Image in saved deal:", savedDeal.image);
    
    res.status(201).json({ success: true, deal: savedDeal });
  } catch (err) {
    console.error("Error creating deal:", err);
    res.status(500).json({ message: "Error creating deal: " + err.message });
  }
};

// Update deal
export const updateDeal = async (req, res) => {
  try {
    const { restaurantId, dealId } = req.params;
    const { title, description, image, price, validTill, featured, spiceLevel, dietary, cuisine, dealType, startTime, endTime, isActive } = req.body;
    
    console.log("Updating deal with data:", { title, description, image, price, validTill, featured, spiceLevel, dietary, cuisine, dealType, startTime, endTime, isActive });
    console.log("Image URL received:", image);
    
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Find the deal in the array
    const dealIndex = restaurant.deals.findIndex(d => d._id.toString() === dealId);
    if (dealIndex === -1) {
      return res.status(404).json({ message: "Deal not found" });
    }

    const deal = restaurant.deals[dealIndex];
    
    // Validate featured deal based on subscription plan
    if (featured !== undefined) {
      const isFeatured = featured === true || featured === 'true';
      if (isFeatured && restaurant.subscriptionPlan === 'free') {
        return res.status(403).json({ 
          message: "Featured deals require a paid subscription plan. Please upgrade to Basic or Premium plan." 
        });
      }
      deal.featured = isFeatured;
    }
    if (dealType !== undefined) {
      if (dealType && !["day", "night", "midnight"].includes(dealType)) {
        return res.status(400).json({ message: "Invalid dealType" });
      }
      deal.dealType = dealType || null;
    }
    if (startTime !== undefined) {
      deal.startTime = startTime ? new Date(startTime) : undefined;
    }
    if (endTime !== undefined) {
      deal.endTime = endTime ? new Date(endTime) : undefined;
      if (deal.startTime && deal.endTime && deal.endTime <= deal.startTime) {
        return res.status(400).json({ message: "endTime must be after startTime" });
      }
    }
    if (isActive !== undefined) {
      deal.isActive = Boolean(isActive);
    }
    
    // Validate spice level if provided
    if (spiceLevel !== undefined && spiceLevel !== null) {
      const spice = parseInt(spiceLevel);
      if (isNaN(spice) || spice < 1 || spice > 5) {
        return res.status(400).json({ message: "Spice level must be between 1 and 5" });
      }
      deal.spiceLevel = spice;
    } else if (spiceLevel === null) {
      deal.spiceLevel = null;
    }
    
    if (title !== undefined) deal.title = title;
    if (description !== undefined) deal.description = description || "";
    if (image !== undefined) {
      deal.image = image || "";
      console.log("Setting deal image to:", deal.image);
    }
    if (price !== undefined) deal.price = price;
    if (validTill !== undefined) deal.validTill = validTill ? new Date(validTill) : undefined;
    if (dietary !== undefined) deal.dietary = dietary || null;
    if (cuisine !== undefined) deal.cuisine = cuisine || null;

    console.log("Deal after update:", deal);
    await restaurant.save();
    
    console.log("Deal updated successfully. Image in saved deal:", deal.image);
    res.json({ success: true, deal });
  } catch (err) {
    console.error("Error updating deal:", err);
    res.status(500).json({ message: "Error updating deal: " + err.message });
  }
};

// Delete deal
export const deleteDeal = async (req, res) => {
  try {
    const { restaurantId, dealId } = req.params;
    
    console.log(`Attempting to delete deal ${dealId} from restaurant ${restaurantId}`);
    
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Find the deal in the array
    const dealIndex = restaurant.deals.findIndex(d => d._id.toString() === dealId);
    if (dealIndex === -1) {
      return res.status(404).json({ message: "Deal not found" });
    }

    // Remove the deal from the array
    restaurant.deals.splice(dealIndex, 1);
    await restaurant.save();
    
    console.log("Deal deleted successfully");
    res.json({ success: true, message: "Deal deleted successfully" });
  } catch (err) {
    console.error("Error deleting deal:", err);
    res.status(500).json({ message: "Error deleting deal: " + err.message });
  }
};

// Upload menu (update menu URL)
export const uploadMenu = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { menuUrl } = req.body; // In production, use multer for file upload
    
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    restaurant.menu = menuUrl;
    await restaurant.save();
    
    res.json({ success: true, restaurant });
  } catch (err) {
    console.error("Error uploading menu:", err);
    res.status(500).json({ message: "Error uploading menu: " + err.message });
  }
};

// Upload deal image
export const uploadDealImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    // Return URL to access the uploaded image
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/images/${req.file.filename}`;
    res.json({ success: true, imageUrl });
  } catch (err) {
    console.error("Error uploading image:", err);
    res.status(500).json({ message: "Error uploading image: " + err.message });
  }
};

// Get pending restaurants
export const getPendingRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ status: 'pending' })
      .populate('restaurantManagerId', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, restaurants });
  } catch (err) {
    console.error("Error fetching pending restaurants:", err);
    res.status(500).json({ message: "Error fetching pending restaurants: " + err.message });
  }
};

// Approve restaurant
export const approveRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findById(id);
    
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    restaurant.status = 'approved';
    await restaurant.save();
    
    res.json({ success: true, message: "Restaurant approved successfully", restaurant });
  } catch (err) {
    console.error("Error approving restaurant:", err);
    res.status(500).json({ message: "Error approving restaurant: " + err.message });
  }
};

// Reject restaurant
export const rejectRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findById(id);
    
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    restaurant.status = 'rejected';
    await restaurant.save();
    
    res.json({ success: true, message: "Restaurant rejected", restaurant });
  } catch (err) {
    console.error("Error rejecting restaurant:", err);
    res.status(500).json({ message: "Error rejecting restaurant: " + err.message });
  }
};

// Get pending deals
export const getPendingDeals = async (req, res) => {
  try {
    const restaurants = await Restaurant.find()
      .populate('restaurantManagerId', 'name email');
    
    const pendingDeals = [];
    restaurants.forEach(restaurant => {
      if (restaurant.deals && restaurant.deals.length > 0) {
        restaurant.deals.forEach(deal => {
          if (deal.status === 'pending') {
            pendingDeals.push({
              ...deal.toObject(),
              restaurantId: restaurant._id,
              restaurantName: restaurant.name,
              restaurantCity: restaurant.city,
              restaurantManager: restaurant.restaurantManagerId
            });
          }
        });
      }
    });
    
    res.json({ success: true, deals: pendingDeals });
  } catch (err) {
    console.error("Error fetching pending deals:", err);
    res.status(500).json({ message: "Error fetching pending deals: " + err.message });
  }
};

// Approve deal
export const approveDeal = async (req, res) => {
  try {
    const { restaurantId, dealId } = req.params;
    const restaurant = await Restaurant.findById(restaurantId);
    
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const deal = restaurant.deals.id(dealId);
    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    deal.status = 'approved';
    deal.isActive = true;
    await restaurant.save();
    
    res.json({ success: true, message: "Deal approved successfully", deal });
  } catch (err) {
    console.error("Error approving deal:", err);
    res.status(500).json({ message: "Error approving deal: " + err.message });
  }
};

// Reject deal
export const rejectDeal = async (req, res) => {
  try {
    const { restaurantId, dealId } = req.params;
    const restaurant = await Restaurant.findById(restaurantId);
    
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const deal = restaurant.deals.id(dealId);
    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    deal.status = 'rejected';
    await restaurant.save();
    
    res.json({ success: true, message: "Deal rejected", deal });
  } catch (err) {
    console.error("Error rejecting deal:", err);
    res.status(500).json({ message: "Error rejecting deal: " + err.message });
  }
};

export const getRestaurantAnalytics = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    const deals = (restaurant.deals || []).map(d => ({
      dealId: d._id,
      title: d.title,
      views: d.views || 0,
      clicks: d.clicks || 0,
      conversionRate: (d.views || 0) > 0 ? Number(((d.clicks || 0) / d.views) * 100).toFixed(2) : 0
    }));
    const summary = {
      restaurantId: restaurant._id,
      name: restaurant.name,
      totalViews: restaurant.totalViews || 0,
      totalClicks: restaurant.totalClicks || 0,
      conversionRate: (restaurant.totalViews || 0) > 0 ? Number(((restaurant.totalClicks || 0) / restaurant.totalViews) * 100).toFixed(2) : 0
    };
    res.json({ summary, deals });
  } catch (err) {
    console.error("Error fetching restaurant analytics:", err);
    res.status(500).json({ message: "Error fetching restaurant analytics" });
  }
};
