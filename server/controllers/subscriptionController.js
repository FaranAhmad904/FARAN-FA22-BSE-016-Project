// server/controllers/subscriptionController.js
import Subscription from "../models/Subscription.js";
import Restaurant from "../models/Restaurant.js";

// Subscription plan details
const PLAN_DETAILS = {
  basic: {
    name: 'Basic Plan',
    price: 29.99,
    features: ['Featured restaurant listing', 'Up to 5 featured deals', 'Basic analytics'],
    duration: 30 // days
  },
  premium: {
    name: 'Premium Plan',
    price: 59.99,
    features: ['Featured restaurant listing', 'Unlimited featured deals', 'Advanced analytics', 'Priority support'],
    duration: 30 // days
  }
};

// Get available subscription plans
export const getPlans = async (req, res) => {
  try {
    res.json({ success: true, plans: PLAN_DETAILS });
  } catch (err) {
    console.error("Error fetching plans:", err);
    res.status(500).json({ message: "Error fetching plans: " + err.message });
  }
};

// Create subscription (payment processing)
export const createSubscription = async (req, res) => {
  try {
    const restaurantManagerId = req.user.id;
    const { plan, paymentMethod, transactionId } = req.body;
    
    if (!plan || !['basic', 'premium'].includes(plan)) {
      return res.status(400).json({ message: "Valid plan (basic or premium) is required" });
    }

    const restaurant = await Restaurant.findOne({ restaurantManagerId });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found. Please register your restaurant first." });
    }

    if (restaurant.status !== 'approved') {
      return res.status(403).json({ 
        message: "Your restaurant must be approved before subscribing to a plan." 
      });
    }

    const planDetails = PLAN_DETAILS[plan];
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + planDetails.duration);

    // Create subscription record
    const subscription = new Subscription({
      restaurantId: restaurant._id,
      restaurantManagerId,
      plan,
      amount: planDetails.price,
      status: 'paid', // In production, verify payment first
      paymentDate: new Date(),
      expiryDate,
      paymentMethod: paymentMethod || 'manual',
      transactionId: transactionId || `TXN-${Date.now()}`
    });
    await subscription.save();

    // Update restaurant subscription plan
    restaurant.subscriptionPlan = plan;
    await restaurant.save();

    res.status(201).json({ 
      success: true, 
      message: `Successfully subscribed to ${planDetails.name}`,
      subscription,
      restaurant
    });
  } catch (err) {
    console.error("Error creating subscription:", err);
    res.status(500).json({ message: "Error creating subscription: " + err.message });
  }
};

// Get manager's subscription
export const getMySubscription = async (req, res) => {
  try {
    const restaurantManagerId = req.user.id;
    
    const restaurant = await Restaurant.findOne({ restaurantManagerId });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const subscription = await Subscription.findOne({ 
      restaurantManagerId,
      status: 'paid'
    }).sort({ createdAt: -1 });

    res.json({ 
      success: true, 
      subscription,
      currentPlan: restaurant.subscriptionPlan,
      restaurant
    });
  } catch (err) {
    console.error("Error fetching subscription:", err);
    res.status(500).json({ message: "Error fetching subscription: " + err.message });
  }
};

// Get all subscriptions (admin only)
export const getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find()
      .populate('restaurantId', 'name city')
      .populate('restaurantManagerId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, subscriptions });
  } catch (err) {
    console.error("Error fetching subscriptions:", err);
    res.status(500).json({ message: "Error fetching subscriptions: " + err.message });
  }
};

