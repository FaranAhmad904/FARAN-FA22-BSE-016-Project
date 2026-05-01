import mongoose from "mongoose";

   const reviewSchema = new mongoose.Schema({
     userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
     rating: { type: Number, required: true, min: 1, max: 5 },
     comment: { type: String },
     sentiment: { type: String, default: "neutral" },
     confidence: { type: Number, default: 0 },
     hybridScore: { type: Number, default: 0 },
     createdAt: { type: Date, default: Date.now }
   });

   const dealSchema = new mongoose.Schema({
     title: { type: String, required: true },
     description: { type: String },
     image: { type: String },
     price: { type: Number, required: true },
     validTill: { type: Date },
     dealType: { type: String, enum: ["day", "night", "midnight"], default: null },
     startTime: { type: Date },
     endTime: { type: Date },
     isActive: { type: Boolean, default: false },
     featured: { type: Boolean, default: false }, // Featured deal flag
     status: { 
       type: String, 
       enum: ['pending', 'approved', 'rejected'], 
       default: 'pending' 
     }, // Deal approval status
     // AI Recommendation Fields
     spiceLevel: { type: Number, min: 1, max: 5, default: null }, // Deal-specific spice level (1-5)
     dietary: { type: String, enum: ["none", "vegetarian", "halal", "vegan"], default: null }, // Deal-specific dietary info
     cuisine: { type: String, default: null }, // Deal-specific cuisine (if different from restaurant)
     reviews: [reviewSchema], // Add reviews array to dealSchema
     views: { type: Number, default: 0 },
     clicks: { type: Number, default: 0 }
   });

   const restaurantSchema = new mongoose.Schema(
     {
       name: { type: String, required: true },
       city: { type: String, required: true },
       cuisine: { type: String },
       image: { type: String }, // Restaurant image uploaded by admin
       menu: { type: String }, // URL or path to menu file
      latitude: { type: Number, default: null }, // Restaurant latitude
      longitude: { type: Number, default: null }, // Restaurant longitude
      featured: { type: Boolean, default: false },
       status: { 
         type: String, 
         enum: ['pending', 'approved', 'rejected'], 
         default: 'pending' 
       }, // Restaurant approval status
       restaurantManagerId: { 
         type: mongoose.Schema.Types.ObjectId, 
         ref: "User", 
         required: false 
       }, // Link to restaurant manager
       subscriptionPlan: { 
         type: String, 
         enum: ['free', 'basic', 'premium'], 
         default: 'free' 
       }, // Subscription plan for paid membership
       deals: [dealSchema], // Deals array with reviews
       totalViews: { type: Number, default: 0 },
       totalClicks: { type: Number, default: 0 }
     },
     { timestamps: true }
   );

   const Restaurant = mongoose.model("Restaurant", restaurantSchema);
   export default Restaurant;
