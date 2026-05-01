import Restaurant from '../models/Restaurant.js';
import { calculateHybridScore } from '../utils/sentimentRanking.js';

export const recommendDeals = async (req, res) => {
    try {
        console.log("DEBUG: Starting deal recommendation process...");
        
        const restaurants = await Restaurant.find();
        console.log(`DEBUG: Found ${restaurants.length} restaurants`);
        
        let allDeals = [];
        
        restaurants.forEach(restaurant => {
            restaurant.deals.forEach(deal => {
                const dealWithRestaurant = {
                    ...deal.toObject(),
                    restaurantId: restaurant._id,
                    restaurantName: restaurant.name,
                    restaurantCity: restaurant.city
                };
                allDeals.push(dealWithRestaurant);
            });
        });

        console.log(`DEBUG: Total deals found: ${allDeals.length}`);

        const recommended = allDeals
            .map(deal => {
                const score = calculateHybridScore(deal);
                const reviewCount = deal.reviews?.length || 0;
                const sentimentCount = deal.reviews?.filter(r => r.sentiment && r.sentiment !== "neutral").length || 0;
                const positiveReviews = deal.reviews?.filter(r => r.sentiment === "positive" || r.sentiment === "neutral").length || 0;
                
                console.log(`DEBUG: Deal "${deal.title}" - Reviews: ${reviewCount}, Positive/Neutral: ${positiveReviews}, Score: ${score}`);
                
                return { ...deal, hybridScore: score };
            })
            .filter(deal => {
                // More lenient filtering - include deals with any reviews or positive/neutral sentiment
                const hasReviews = deal.reviews && deal.reviews.length > 0;
                const hasPositiveSentiment = deal.reviews?.some(r => r.sentiment === "positive" || r.sentiment === "neutral");
                
                console.log(`DEBUG: Filtering deal "${deal.title}" - Has Reviews: ${hasReviews}, Has Positive: ${hasPositiveSentiment}`);
                
                return hasReviews && hasPositiveSentiment;
            })
            .sort((a, b) => b.hybridScore - a.hybridScore);

        console.log(`DEBUG: Final recommended deals count: ${recommended.length}`);
        
        if (recommended.length === 0) {
            console.log("DEBUG: No recommended deals found - checking raw deal data...");
            allDeals.forEach((deal, index) => {
                if (deal.reviews && deal.reviews.length > 0) {
                    console.log(`DEBUG: Deal ${index} - "${deal.title}" has reviews:`, deal.reviews.length);
                    deal.reviews.forEach((review, rIndex) => {
                        console.log(`   Review ${rIndex}: "${review.comment}" - Sentiment: ${review.sentiment}, Confidence: ${review.confidence}, Hybrid: ${review.hybridScore}`);
                    });
                }
            });
        }

        res.json(recommended);
    } catch (err) {
        console.error('Error in deal recommendation:', err);
        res.status(500).json({ error: "Failed to fetch recommended deals" });
    }
};
