// server/controllers/restaurantManagerController.js
import Restaurant from "../models/Restaurant.js";

// Register a new restaurant (pending approval)
export const registerRestaurant = async (req, res) => {
  try {
    const { name, city, cuisine, menu, latitude, longitude } = req.body;
    const restaurantManagerId = req.user.id; // From auth middleware
    
    if (!name || !city) {
      return res.status(400).json({ message: "Name and city are required" });
    }

    // Check if manager already has a restaurant
    const existingRestaurant = await Restaurant.findOne({ restaurantManagerId });
    if (existingRestaurant) {
      return res.status(400).json({ 
        message: "You already have a registered restaurant. Please update your existing restaurant." 
      });
    }

    let imageUrl = "";
    
    // Handle image upload
    if (req.file && req.file.path) {
      imageUrl = `/uploads/images/${req.file.filename}`;
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
      restaurantManagerId,
      status: 'pending' // New restaurants need approval
    });
    await restaurant.save();
    
    res.status(201).json({ 
      success: true, 
      message: "Restaurant registered successfully. Waiting for admin approval.",
      restaurant 
    });
  } catch (err) {
    console.error("Error registering restaurant:", err);
    res.status(500).json({ message: "Error registering restaurant: " + err.message });
  }
};

// Get manager's restaurant
export const getMyRestaurant = async (req, res) => {
  try {
    const restaurantManagerId = req.user.id;
    
    const restaurant = await Restaurant.findOne({ restaurantManagerId });
    if (!restaurant) {
      return res.status(404).json({ message: "No restaurant found. Please register your restaurant first." });
    }
    
    res.json({ success: true, restaurant });
  } catch (err) {
    console.error("Error fetching restaurant:", err);
    res.status(500).json({ message: "Error fetching restaurant: " + err.message });
  }
};

// Update manager's restaurant (requires re-approval if status changes)
export const updateMyRestaurant = async (req, res) => {
  try {
    const restaurantManagerId = req.user.id;
    const { name, city, cuisine, menu, latitude, longitude } = req.body;
    
    const restaurant = await Restaurant.findOne({ restaurantManagerId });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // If restaurant was approved and manager makes changes, set back to pending
    const wasApproved = restaurant.status === 'approved';
    
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
    
    // Handle image upload
    if (req.file && req.file.path) {
      restaurant.image = `/uploads/images/${req.file.filename}`;
    }
    
    // If it was approved and changes were made, require re-approval
    if (wasApproved && (name || city || cuisine !== undefined || menu !== undefined || latitude !== undefined || longitude !== undefined || req.file)) {
      restaurant.status = 'pending';
    }
    
    await restaurant.save();
    
    res.json({ 
      success: true, 
      message: wasApproved ? "Restaurant updated. Changes require admin approval." : "Restaurant updated.",
      restaurant 
    });
  } catch (err) {
    console.error("Error updating restaurant:", err);
    res.status(500).json({ message: "Error updating restaurant: " + err.message });
  }
};

// Add a deal to manager's restaurant (pending approval)
export const addDeal = async (req, res) => {
  try {
    const restaurantManagerId = req.user.id;
    const { title, description, image, price, validTill, spiceLevel, dietary, cuisine, dealType, startTime, endTime } = req.body;
    
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

    const restaurant = await Restaurant.findOne({ restaurantManagerId });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found. Please register your restaurant first." });
    }

    // Only approved restaurants can add deals (but deals need approval)
    if (restaurant.status !== 'approved') {
      return res.status(403).json({ 
        message: "Your restaurant must be approved before you can add deals." 
      });
    }

    const deal = {
      title,
      description: description || "",
      image: image || "",
      price,
      validTill: validTill ? new Date(validTill) : undefined,
      dealType: dealType || null,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      isActive: false,
      featured: false, // Deals cannot be featured until approved and subscription is active
      status: 'pending', // All new deals need approval
      spiceLevel: spiceLevel !== undefined && spiceLevel !== null ? parseInt(spiceLevel) : null,
      dietary: dietary || null,
      cuisine: cuisine || null,
      reviews: []
    };

    restaurant.deals.push(deal);
    await restaurant.save();
    
    const savedDeal = restaurant.deals[restaurant.deals.length - 1];
    
    res.status(201).json({ 
      success: true, 
      message: "Deal added successfully. Waiting for admin approval.",
      deal: savedDeal 
    });
  } catch (err) {
    console.error("Error adding deal:", err);
    res.status(500).json({ message: "Error adding deal: " + err.message });
  }
};

// Get all deals for manager's restaurant
export const getMyDeals = async (req, res) => {
  try {
    const restaurantManagerId = req.user.id;
    
    const restaurant = await Restaurant.findOne({ restaurantManagerId });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    
    res.json({ success: true, deals: restaurant.deals || [] });
  } catch (err) {
    console.error("Error fetching deals:", err);
    res.status(500).json({ message: "Error fetching deals: " + err.message });
  }
};

// Update a deal (requires re-approval)
export const updateDeal = async (req, res) => {
  try {
    const restaurantManagerId = req.user.id;
    const { dealId } = req.params;
    const { title, description, image, price, validTill, spiceLevel, dietary, cuisine, dealType, startTime, endTime } = req.body;
    
    const restaurant = await Restaurant.findOne({ restaurantManagerId });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const dealIndex = restaurant.deals.findIndex(d => d._id.toString() === dealId);
    if (dealIndex === -1) {
      return res.status(404).json({ message: "Deal not found" });
    }

    const deal = restaurant.deals[dealIndex];
    const wasApproved = deal.status === 'approved';
    
    if (title !== undefined) deal.title = title;
    if (description !== undefined) deal.description = description || "";
    if (image !== undefined) deal.image = image || "";
    if (price !== undefined) deal.price = price;
    if (validTill !== undefined) deal.validTill = validTill ? new Date(validTill) : undefined;
    if (spiceLevel !== undefined && spiceLevel !== null) {
      const spice = parseInt(spiceLevel);
      if (isNaN(spice) || spice < 1 || spice > 5) {
        return res.status(400).json({ message: "Spice level must be between 1 and 5" });
      }
      deal.spiceLevel = spice;
    } else if (spiceLevel === null) {
      deal.spiceLevel = null;
    }
    if (dietary !== undefined) deal.dietary = dietary || null;
    if (cuisine !== undefined) deal.cuisine = cuisine || null;
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
    
    // If deal was approved and changes were made, require re-approval
    if (wasApproved && (title || description !== undefined || image !== undefined || price !== undefined || dealType !== undefined || startTime !== undefined || endTime !== undefined)) {
      deal.status = 'pending';
      deal.isActive = false;
    }
    
    await restaurant.save();
    
    res.json({ 
      success: true, 
      message: wasApproved ? "Deal updated. Changes require admin approval." : "Deal updated.",
      deal 
    });
  } catch (err) {
    console.error("Error updating deal:", err);
    res.status(500).json({ message: "Error updating deal: " + err.message });
  }
};

// Delete a deal
export const deleteDeal = async (req, res) => {
  try {
    const restaurantManagerId = req.user.id;
    const { dealId } = req.params;
    
    const restaurant = await Restaurant.findOne({ restaurantManagerId });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const dealIndex = restaurant.deals.findIndex(d => d._id.toString() === dealId);
    if (dealIndex === -1) {
      return res.status(404).json({ message: "Deal not found" });
    }

    restaurant.deals.splice(dealIndex, 1);
    await restaurant.save();
    
    res.json({ success: true, message: "Deal deleted successfully" });
  } catch (err) {
    console.error("Error deleting deal:", err);
    res.status(500).json({ message: "Error deleting deal: " + err.message });
  }
};

// Upload deal image
export const uploadDealImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const imageUrl = `http://localhost:7000/uploads/images/${req.file.filename}`;
    res.json({ success: true, imageUrl });
  } catch (err) {
    console.error("Error uploading image:", err);
    res.status(500).json({ message: "Error uploading image: " + err.message });
  }
};

// Get analytics for manager's restaurant
export const getManagerAnalytics = async (req, res) => {
  try {
    const restaurantManagerId = req.user.id;
    const restaurant = await Restaurant.findOne({ restaurantManagerId });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const totalViews = restaurant.totalViews || 0;
    const totalClicks = restaurant.totalClicks || 0;

    // Calculate conversion rate
    const conversionRate = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : 0;

    // Get top performing deals
    const topDeals = (restaurant.deals || [])
      .map(deal => ({
        id: deal._id,
        title: deal.title,
        views: deal.views || 0,
        clicks: deal.clicks || 0,
        conversion: (deal.views || 0) > 0 ? (((deal.clicks || 0) / (deal.views || 0)) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5); // Top 5 deals

    // Mock daily data for charts (since we don't store historical data yet)
    // In a real app, we would have a separate Analytics model storing daily stats
    // Distribute total stats roughly across the week for visualization
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dailyStats = days.map(day => {
        // Random distribution logic for demo purposes
        const viewFactor = Math.random() * 0.2; 
        const clickFactor = Math.random() * 0.2;
        return {
            name: day,
            views: Math.max(1, Math.floor(totalViews * viewFactor)),
            clicks: Math.max(0, Math.floor(totalClicks * clickFactor))
        };
    });

    res.json({
      success: true,
      analytics: {
        totalViews,
        totalClicks,
        conversionRate,
        topDeals,
        dailyStats
      }
    });
  } catch (err) {
    console.error("Error fetching analytics:", err);
    res.status(500).json({ message: "Error fetching analytics: " + err.message });
  }
};

