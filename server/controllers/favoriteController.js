// server/controllers/favoriteController.js
import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
import UserPreference from "../models/UserPreference.js";

export const addFavorite = async (req, res) => {
  try {
    const { restaurantId, dealId } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    const deal = restaurant.deals.id(dealId);
    if (!deal) return res.status(404).json({ message: "Deal not found" });

    const exists = user.favorites.find(
      (f) =>
        f.restaurantId.toString() === restaurantId &&
        f.dealId.toString() === dealId
    );
    if (!exists) {
      user.favorites.push({ restaurantId, dealId });
      await user.save();
      
      // Track "save" interaction in UserPreference
      try {
        const dealPrice = deal.price;
        // 1. Try to increment existing deal interaction
        const updateResult = await UserPreference.updateOne(
          { 
            userId: req.user.id, 
            "dealInteractions.deal_id": dealId 
          },
          {
            $inc: { 
              "dealInteractions.$.actions.save": 1,
              engagementScore: 3
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
                  actions: { view: 0, click: 0, save: 1 },
                  lastInteractionAt: new Date()
                }
              },
              $inc: { engagementScore: 3 } // Save worth more than click
            },
            { upsert: true }
          );
        }
      } catch (prefError) {
        console.error("Error tracking user preference save:", prefError);
      }
    }
    res.json({ success: true, message: "Added to favorites" });
  } catch (err) {
    console.error("Error saving favorite:", err.message);
    res.status(500).json({ message: "Error saving favorite: " + err.message });
  }
};

export const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("favorites.restaurantId");
    if (!user) return res.status(404).json({ message: "User not found" });

    const favDeals = user.favorites
      .map((fav) => {
        const restaurant = fav.restaurantId;
        if (!restaurant) return null;
        const deal = restaurant.deals.id(fav.dealId);
        return deal
          ? {
              _id: deal._id,
              title: deal.title,
              description: deal.description,
              image: deal.image || "https://via.placeholder.com/400x200",
              price: deal.price,
              validTill: deal.validTill,
              restaurantName: restaurant.name,
            }
          : null;
      })
      .filter((d) => d !== null);

    res.json(favDeals);
  } catch (err) {
    res.status(500).json({ message: "Error fetching favorites: " + err.message });
  }
};

export const removeFavorite = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.favorites = user.favorites.filter(
      (f) => f.dealId.toString() !== req.params.dealId
    );
    await user.save();

    res.json({ success: true, message: "Removed from favorites" });
  } catch (err) {
    res.status(500).json({ message: "Error removing favorite" });
  }
};
