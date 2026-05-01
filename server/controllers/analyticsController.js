import Restaurant from "../models/Restaurant.js";
import UserPreference from "../models/UserPreference.js";

export const recordView = async (req, res) => {
  try {
    const { restaurantId, dealId } = req.body;
    if (!restaurantId) {
      return res.status(400).json({ message: "restaurantId is required" });
    }
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    restaurant.totalViews = (restaurant.totalViews || 0) + 1;
    
    let dealPrice = 0;
    if (dealId) {
      const deal = restaurant.deals.id(dealId);
      if (deal) {
        deal.views = (deal.views || 0) + 1;
        dealPrice = deal.price;
      }
    }
    await restaurant.save();

    // Track User Interaction if authenticated and dealId is present
    if (req.user && dealId && dealPrice !== undefined) {
      try {
        // Use atomic update pattern to handle existing vs new deal interaction
        // 1. Try to increment existing deal interaction
        const updateResult = await UserPreference.updateOne(
          { 
            userId: req.user.id, 
            "dealInteractions.deal_id": dealId 
          },
          {
            $inc: { 
              "dealInteractions.$.actions.view": 1,
              engagementScore: 1
            },
            $set: { 
              "dealInteractions.$.lastInteractionAt": new Date(),
              "dealInteractions.$.dealPrice": dealPrice
            }
          }
        );

        // 2. If no document modified, push new deal interaction
        if (updateResult.matchedCount === 0) {
           await UserPreference.updateOne(
            { userId: req.user.id },
            {
              $push: {
                dealInteractions: {
                  deal_id: dealId,
                  dealPrice: dealPrice,
                  actions: { view: 1, click: 0, save: 0 },
                  lastInteractionAt: new Date()
                }
              },
              $inc: { engagementScore: 1 }
            },
            { upsert: true }
          );
        }
      } catch (prefError) {
        console.error("Error tracking user preference view:", prefError);
        // Don't fail the request if tracking fails
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Error recording view: " + err.message });
  }
};



export const recordClick = async (req, res) => {
  try {
    const { restaurantId, dealId } = req.body;
    if (!restaurantId) {
      return res.status(400).json({ message: "restaurantId is required" });
    }
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    restaurant.totalClicks = (restaurant.totalClicks || 0) + 1;
    
    let dealPrice = 0;
    if (dealId) {
      const deal = restaurant.deals.id(dealId);
      if (deal) {
        deal.clicks = (deal.clicks || 0) + 1;
        dealPrice = deal.price;
      }
    }
    await restaurant.save();

    // Track User Interaction if authenticated and dealId is present
    if (req.user && dealId && dealPrice !== undefined) {
      try {
        // 1. Try to increment existing deal interaction
        const updateResult = await UserPreference.updateOne(
          { 
            userId: req.user.id, 
            "dealInteractions.deal_id": dealId 
          },
          {
            $inc: { 
              "dealInteractions.$.actions.click": 1,
              engagementScore: 2
            },
            $set: { 
              "dealInteractions.$.lastInteractionAt": new Date(),
              "dealInteractions.$.dealPrice": dealPrice
            }
          }
        );

        // 2. If no document modified, push new deal interaction
        if (updateResult.matchedCount === 0) {
           await UserPreference.updateOne(
            { userId: req.user.id },
            {
              $push: {
                dealInteractions: {
                  deal_id: dealId,
                  dealPrice: dealPrice,
                  actions: { view: 0, click: 1, save: 0 },
                  lastInteractionAt: new Date()
                }
              },
              $inc: { engagementScore: 2 } // Click worth more than view
            },
            { upsert: true }
          );
        }
      } catch (prefError) {
        console.error("Error tracking user preference click:", prefError);
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Error recording click: " + err.message });
  }
};
