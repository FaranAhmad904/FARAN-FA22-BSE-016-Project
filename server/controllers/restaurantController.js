// server/controllers/restaurantController.js
import Restaurant from "../models/Restaurant.js";

export const getRestaurants = async (req, res) => {
  try {
    const { city, cuisine, search, featuredOnly } = req.query;
    let query = { status: 'approved' }; // Only show approved restaurants to customers

    if (city) query.city = city;
    if (cuisine) query.cuisine = cuisine;
    if (search) query.name = { $regex: search, $options: "i" };

    let restaurants = await Restaurant.find(query);
    
    // Sort restaurants: featured restaurants first
    restaurants.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });
    
    // Sort deals within each restaurant: featured deals first, only show approved deals
    restaurants = restaurants.map(restaurant => {
      if (restaurant.deals && restaurant.deals.length > 0) {
        const approvedDeals = restaurant.deals.filter(deal => deal.status === 'approved' && deal.isActive === true);
        
        // Sort deals: featured first, then by creation date
        const sortedDeals = [...approvedDeals].sort((a, b) => {
          // Featured deals come first
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          // If both have same featured status, maintain original order
          return 0;
        });
        
        // If featuredOnly filter is enabled, only return restaurants with featured deals
        if (featuredOnly === 'true' || featuredOnly === true) {
          const featuredDeals = sortedDeals.filter(deal => deal.featured);
          if (featuredDeals.length === 0) {
            return null; // Filter out restaurants with no featured deals
          }
          return {
            ...restaurant.toObject(),
            deals: featuredDeals
          };
        }
        
        return {
          ...restaurant.toObject(),
          deals: sortedDeals
        };
      }
      // If featuredOnly is true and restaurant has no deals or no featured deals, filter it out
      if (featuredOnly === 'true' || featuredOnly === true) {
        return null;
      }
      return restaurant;
    }).filter(restaurant => restaurant !== null); // Remove null entries
    
    // Filter out restaurants with no deals if featuredOnly is enabled
    if (featuredOnly === 'true' || featuredOnly === true) {
      restaurants = restaurants.filter(restaurant => 
        restaurant.deals && restaurant.deals.length > 0
      );
    }
    
    res.json(restaurants);
  } catch (err) {
    console.error("Error fetching restaurants:", err.message);
    res.status(500).json({ message: "Error fetching restaurants" });
  }
};
