"""
DineMate AI Recommendation Service
===================================

This Flask service implements a content-based recommendation algorithm
for restaurant recommendations based on user preferences.

Algorithm: Content-Based Filtering
- Converts user preferences into a preference vector
- Scores each restaurant using weighted feature similarity
- Returns top 5 recommendations with match scores and explanations

No deep learning - simple, explainable algorithm suitable for FYP viva.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime
import numpy as np
from sklearn.preprocessing import OneHotEncoder
from sklearn.metrics.pairwise import cosine_similarity
import warnings
warnings.filterwarnings('ignore')
from sentiment_analysis import sentiment_bp

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests from React frontend

# Register sentiment analysis blueprint
app.register_blueprint(sentiment_bp, url_prefix='/sentiment')

# ============================================================================
# MONGODB CONNECTION
# ============================================================================

# MongoDB connection setup
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('MONGO_DB_NAME', 'resturantfinder')

try:
    mongo_client = MongoClient(MONGO_URL)
    db = mongo_client[DB_NAME]
    restaurants_collection = db['restaurants']
    user_preferences_collection = db['userpreferences']
    print(f"[OK] MongoDB connected to database: {DB_NAME}")
    
    # Test connection
    mongo_client.admin.command('ping')
    print("[OK] MongoDB connection verified")
except Exception as e:
    print(f"[ERROR] MongoDB connection error: {e}")
    mongo_client = None
    db = None
    restaurants_collection = None
    user_preferences_collection = None

# ============================================================================
# MACHINE LEARNING - CONTENT-BASED FILTERING WITH COSINE SIMILARITY
# ============================================================================

"""
WHY COSINE SIMILARITY FOR RECOMMENDATIONS?

Cosine Similarity is a machine learning technique that measures the cosine of the angle
between two vectors in a multi-dimensional space. In recommendation systems:

1. **Mathematical Foundation**: It measures similarity based on direction, not magnitude.
   This is perfect for recommendations where we care about preference patterns, not
   absolute values.

2. **Content-Based Filtering**: We convert restaurants and user preferences into feature
   vectors. Cosine similarity finds restaurants with similar feature patterns to the user's
   preferences.

3. **Why Not Deep Learning?**: 
   - Deep learning requires large datasets (thousands of users/restaurants)
   - Our FYP dataset is smaller, making ML more appropriate
   - ML is more explainable - we can show WHY a restaurant was recommended
   - Faster training and inference
   - No need for GPU or complex infrastructure

4. **Unsupervised Learning**: This is an unsupervised content-based filtering approach.
   We don't need historical user interactions - we learn from restaurant features and
   user preferences directly.

5. **Hybrid Approach**: We combine ML (cosine similarity) with rule-based scoring for
   better accuracy and explainability.
"""


def prepare_feature_matrix(restaurants):
    """
    Convert restaurants and deals into a feature matrix for ML.
    
    This function implements feature engineering - converting categorical and numerical
    data into a format that machine learning algorithms can process.
    
    Features extracted:
    - cuisine (one-hot encoded)
    - city (one-hot encoded)
    - budget_category (derived from deal prices)
    - spice_level (normalized 1-5 scale)
    - dietary (one-hot encoded)
    
    Args:
        restaurants: List of restaurant dictionaries with deals
    
    Returns:
        feature_matrix: numpy array of shape (n_restaurants, n_features)
        feature_names: List of feature names for interpretability
        restaurant_indices: Mapping from matrix index to restaurant
    """
    print("[ML] Preparing feature matrix for machine learning...")
    
    # Collect all unique values for one-hot encoding
    all_cuisines = set()
    all_cities = set()
    all_dietary = set(['none', 'vegetarian', 'halal', 'vegan'])
    
    restaurant_features = []
    restaurant_indices = []
    
    for idx, restaurant in enumerate(restaurants):
        # Get restaurant-level features
        restaurant_cuisine = restaurant.get('cuisine', '')
        restaurant_city = restaurant.get('city', '')
        
        # Get deal-level features (use best matching deal or average)
        deals = restaurant.get('deals', [])
        
        # Find best deal with AI data, or use restaurant defaults
        best_deal = None
        best_deal_score = 0
        
        for deal in deals:
            if isinstance(deal, dict):
                # Score deal based on completeness of AI data
                deal_score = 0
                if deal.get('spiceLevel') is not None:
                    deal_score += 1
                if deal.get('dietary'):
                    deal_score += 1
                if deal.get('cuisine'):
                    deal_score += 1
                
                if deal_score > best_deal_score:
                    best_deal_score = deal_score
                    best_deal = deal
        
        # Extract features
        cuisine = best_deal.get('cuisine') if best_deal and best_deal.get('cuisine') else restaurant_cuisine
        city = restaurant_city
        dietary = best_deal.get('dietary') if best_deal and best_deal.get('dietary') else 'none'
        
        # Calculate average price for budget category
        prices = [float(d.get('price', 0)) for d in deals if d.get('price')]
        avg_price = sum(prices) / len(prices) if prices else 0
        
        # Categorize budget: 0=low, 1=medium, 2=high
        if avg_price == 0:
            budget_category = 1  # Default to medium
        elif avg_price < 500:
            budget_category = 0  # Low
        elif avg_price < 1500:
            budget_category = 1  # Medium
        else:
            budget_category = 2  # High
        
        # Spice level (normalize to 0-1 scale)
        if best_deal and best_deal.get('spiceLevel') is not None:
            spice_level = best_deal.get('spiceLevel') / 5.0  # Normalize to 0-1
        else:
            # Infer from cuisine
            cuisine_spice_map = {
                "pakistani": 4, "indian": 4, "thai": 5,
                "chinese": 3, "bbq": 3, "fast food": 2, "italian": 2
            }
            cuisine_lower = str(cuisine).lower() if cuisine else ""
            typical_spice = cuisine_spice_map.get(cuisine_lower, 3)
            spice_level = typical_spice / 5.0
        
        # Collect unique values
        if cuisine:
            all_cuisines.add(str(cuisine).lower())
        if city:
            all_cities.add(str(city).lower())
        if dietary:
            all_dietary.add(str(dietary).lower())
        
        restaurant_features.append({
            'cuisine': str(cuisine).lower() if cuisine else '',
            'city': str(city).lower() if city else '',
            'dietary': str(dietary).lower() if dietary else 'none',
            'budget_category': budget_category,
            'spice_level': spice_level
        })
        restaurant_indices.append(idx)
    
    # Create one-hot encoders
    cuisine_list = sorted(list(all_cuisines)) if all_cuisines else ['']
    city_list = sorted(list(all_cities)) if all_cities else ['']
    dietary_list = sorted(list(all_dietary))
    
    # Build feature matrix manually (more control than sklearn's OneHotEncoder)
    n_features = len(cuisine_list) + len(city_list) + len(dietary_list) + 2  # +2 for budget and spice
    feature_matrix = np.zeros((len(restaurant_features), n_features))
    
    feature_names = []
    feature_names.extend([f'cuisine_{c}' for c in cuisine_list])
    feature_names.extend([f'city_{c}' for c in city_list])
    feature_names.extend([f'dietary_{d}' for d in dietary_list])
    feature_names.append('budget_category')
    feature_names.append('spice_level')
    
    # Fill feature matrix
    for i, features in enumerate(restaurant_features):
        col_idx = 0
        
        # Cuisine one-hot
        cuisine_idx = cuisine_list.index(features['cuisine']) if features['cuisine'] in cuisine_list else 0
        feature_matrix[i, cuisine_idx] = 1.0
        col_idx += len(cuisine_list)
        
        # City one-hot
        city_idx = city_list.index(features['city']) if features['city'] in city_list else 0
        feature_matrix[i, col_idx + city_idx] = 1.0
        col_idx += len(city_list)
        
        # Dietary one-hot
        dietary_idx = dietary_list.index(features['dietary']) if features['dietary'] in dietary_list else 0
        feature_matrix[i, col_idx + dietary_idx] = 1.0
        col_idx += len(dietary_list)
        
        # Budget category (normalized)
        feature_matrix[i, col_idx] = features['budget_category'] / 2.0  # Normalize to 0-1
        col_idx += 1
        
        # Spice level (already normalized)
        feature_matrix[i, col_idx] = features['spice_level']
    
    print(f"[ML] Feature matrix shape: {feature_matrix.shape}")
    print(f"[ML] Features: {len(feature_names)} ({len(cuisine_list)} cuisines, {len(city_list)} cities, {len(dietary_list)} dietary, 2 numerical)")
    
    return feature_matrix, feature_names, restaurant_indices


def user_to_vector(user_preferences, feature_names, cuisine_list, city_list, dietary_list):
    """
    Convert user preferences into a feature vector matching the restaurant feature space.
    
    This is the core of content-based filtering - we represent the user's preferences
    in the same feature space as restaurants, allowing cosine similarity to find matches.
    
    Args:
        user_preferences: Dictionary with user preferences
        feature_names: List of feature names from prepare_feature_matrix
        cuisine_list: List of all cuisines
        city_list: List of all cities
        dietary_list: List of all dietary options
    
    Returns:
        user_vector: numpy array representing user preferences
    """
    user_vector = np.zeros(len(feature_names))
    
    # Extract user preferences
    user_cuisines = [str(c).lower() for c in user_preferences.get('cuisine', [])]
    user_city = str(user_preferences.get('city', '')).lower()
    user_dietary = str(user_preferences.get('dietary', 'none')).lower()
    user_budget = user_preferences.get('budget', 'medium').lower()
    user_spice = user_preferences.get('spiceLevel', 3)
    
    col_idx = 0
    
    # Cuisine one-hot (can be multiple - distribute weight evenly)
    if user_cuisines:
        cuisine_weight = 1.0 / len(user_cuisines) if len(user_cuisines) > 0 else 1.0
        for cuisine in user_cuisines:
            cuisine_lower = str(cuisine).lower()
            if cuisine_lower in cuisine_list:
                cuisine_idx = cuisine_list.index(cuisine_lower)
                user_vector[cuisine_idx] = cuisine_weight
    
    col_idx += len(cuisine_list)
    
    # City one-hot
    if user_city in city_list:
        city_idx = city_list.index(user_city)
        user_vector[col_idx + city_idx] = 1.0
    
    col_idx += len(city_list)
    
    # Dietary one-hot
    if user_dietary in dietary_list:
        dietary_idx = dietary_list.index(user_dietary)
        user_vector[col_idx + dietary_idx] = 1.0
    
    col_idx += len(dietary_list)
    
    # Budget category (normalized)
    if user_budget == 'low':
        user_vector[col_idx] = 0.0
    elif user_budget == 'medium':
        user_vector[col_idx] = 0.5
    else:  # high
        user_vector[col_idx] = 1.0
    
    col_idx += 1
    
    # Spice level (normalized)
    user_vector[col_idx] = user_spice / 5.0
    
    return user_vector


def ml_recommend(user_preferences, restaurants):
    """
    Machine Learning recommendation using Cosine Similarity.
    
    This function implements unsupervised content-based filtering:
    1. Convert restaurants to feature vectors
    2. Convert user preferences to feature vector
    3. Calculate cosine similarity between user vector and all restaurant vectors
    4. Return similarity scores
    
    Cosine Similarity Formula: cos(θ) = (A · B) / (||A|| * ||B||)
    - Returns values between -1 and 1
    - 1 = perfect match (same direction)
    - 0 = orthogonal (no similarity)
    - -1 = opposite (completely different)
    
    Args:
        user_preferences: Dictionary with user preferences
        restaurants: List of restaurant dictionaries
    
    Returns:
        ml_scores: Dictionary mapping restaurant index to ML similarity score (0-1)
    """
    if not restaurants or len(restaurants) == 0:
        return {}
    
    print("[ML] Running machine learning recommendation algorithm...")
    
    try:
        # Prepare feature matrix
        feature_matrix, feature_names, restaurant_indices = prepare_feature_matrix(restaurants)
        
        # Extract feature lists for user vector construction
        cuisine_list = [name.replace('cuisine_', '') for name in feature_names if name.startswith('cuisine_')]
        city_list = [name.replace('city_', '') for name in feature_names if name.startswith('city_')]
        dietary_list = [name.replace('dietary_', '') for name in feature_names if name.startswith('dietary_')]
        
        # Convert user preferences to vector
        user_vector = user_to_vector(user_preferences, feature_names, cuisine_list, city_list, dietary_list)
        user_vector = user_vector.reshape(1, -1)  # Reshape for cosine_similarity
        
        # Calculate cosine similarity
        # This is the ML model - it finds restaurants with similar feature patterns
        similarities = cosine_similarity(user_vector, feature_matrix)[0]
        
        # Normalize to 0-1 range (cosine similarity can be -1 to 1, but with our features it's 0-1)
        similarities = np.clip(similarities, 0, 1)
        
        # Create score dictionary
        ml_scores = {}
        for idx, restaurant_idx in enumerate(restaurant_indices):
            ml_scores[restaurant_idx] = float(similarities[idx])
        
        # Log top 5 ML scores
        sorted_scores = sorted(ml_scores.items(), key=lambda x: x[1], reverse=True)
        print("[ML] Top 5 cosine similarity scores:")
        for i, (rest_idx, score) in enumerate(sorted_scores[:5]):
            restaurant_name = restaurants[rest_idx].get('name', f'Restaurant {rest_idx}')
            print(f"  {i+1}. {restaurant_name}: {score:.3f}")
        
        return ml_scores
        
    except Exception as e:
        print(f"[ML ERROR] Machine learning recommendation failed: {e}")
        import traceback
        traceback.print_exc()
        # Return empty scores if ML fails - fall back to rule-based only
        return {}


# ============================================================================
# RULE-BASED FILTERING ALGORITHM (EXISTING)
# ============================================================================

def calculate_cuisine_score(user_cuisines, restaurant_cuisine):
    """
    Calculate cuisine match score.
    
    Args:
        user_cuisines: List of user's preferred cuisines
        restaurant_cuisine: Restaurant's cuisine type
    
    Returns:
        Score between 0 and 1 (1 = perfect match, 0 = no match)
    """
    if not user_cuisines or not restaurant_cuisine:
        return 0.0
    
    # Handle None or non-string values
    if restaurant_cuisine is None:
        return 0.0
    
    # Normalize cuisine strings for comparison
    restaurant_cuisine_lower = str(restaurant_cuisine).lower().strip()
    
    # Check if restaurant cuisine matches any user preference
    for user_cuisine in user_cuisines:
        if user_cuisine.lower().strip() == restaurant_cuisine_lower:
            return 1.0  # Perfect match
    
    # Partial match (e.g., "BBQ" matches "BBQ Restaurant")
    for user_cuisine in user_cuisines:
        if user_cuisine.lower() in restaurant_cuisine_lower or restaurant_cuisine_lower in user_cuisine.lower():
            return 0.7  # Partial match
    
    return 0.0  # No match


def calculate_city_score(user_city, restaurant_city):
    """
    Calculate city match score.
    
    Args:
        user_city: User's preferred city
        restaurant_city: Restaurant's city
    
    Returns:
        Score between 0 and 1
    """
    if not user_city or not restaurant_city:
        return 0.5  # Neutral score if city not specified
    
    # Handle None values
    if user_city is None or restaurant_city is None:
        return 0.5
    
    if str(user_city).lower().strip() == str(restaurant_city).lower().strip():
        return 1.0  # Perfect match
    
    return 0.0  # No match


def calculate_budget_score(user_budget, restaurant_deals):
    """
    Calculate budget match score based on deal prices.
    
    Args:
        user_budget: User's budget preference ("low", "medium", "high")
        restaurant_deals: List of restaurant deals with prices
    
    Returns:
        Score between 0 and 1
    """
    if not restaurant_deals or len(restaurant_deals) == 0:
        return 0.3  # Low score if no deals available
    
    # Calculate average deal price
    # Handle both dict and object formats, and ensure price is numeric
    prices = []
    for deal in restaurant_deals:
        if isinstance(deal, dict):
            price = deal.get('price', 0)
        else:
            price = getattr(deal, 'price', 0)
        
        # Convert to float if it's a valid number
        try:
            price_float = float(price) if price else 0
            if price_float > 0:
                prices.append(price_float)
        except (ValueError, TypeError):
            continue
    
    if not prices:
        return 0.3
    
    avg_price = sum(prices) / len(prices)
    
    # Define budget ranges (in PKR)
    budget_ranges = {
        "low": (0, 500),
        "medium": (500, 1500),
        "high": (1500, float('inf'))
    }
    
    user_range = budget_ranges.get(user_budget.lower(), budget_ranges["medium"])
    min_price, max_price = user_range
    
    # Check if average price falls within user's budget range
    if min_price <= avg_price <= max_price:
        return 1.0  # Perfect match
    elif avg_price < min_price:
        # Cheaper than expected - still good
        return 0.8
    else:
        # More expensive - calculate penalty
        excess = avg_price - max_price
        if excess < 500:
            return 0.5  # Slightly over budget
        else:
            return 0.2  # Significantly over budget


def calculate_spice_score(user_spice_level, restaurant_cuisine):
    """
    Calculate spice level match score.
    
    Note: This is a simplified heuristic since restaurants don't store spice level.
    We infer spice level from cuisine type.
    
    Args:
        user_spice_level: User's preferred spice level (1-5)
        restaurant_cuisine: Restaurant's cuisine type
    
    Returns:
        Score between 0 and 1
    """
    # Map cuisines to typical spice levels (heuristic)
    cuisine_spice_map = {
        "pakistani": 4,
        "indian": 4,
        "thai": 5,
        "chinese": 3,
        "bbq": 3,
        "fast food": 2,
        "italian": 2
    }
    
    if restaurant_cuisine is None:
        restaurant_cuisine_lower = ""
    else:
        restaurant_cuisine_lower = str(restaurant_cuisine).lower()
    
    typical_spice = cuisine_spice_map.get(restaurant_cuisine_lower, 3)  # Default to medium
    
    # Calculate difference
    spice_diff = abs(user_spice_level - typical_spice)
    
    # Convert difference to score (0-1 scale)
    # Perfect match (diff=0) = 1.0, max diff (4) = 0.2
    score = 1.0 - (spice_diff * 0.2)
    return max(0.2, min(1.0, score))  # Clamp between 0.2 and 1.0


def calculate_dietary_score(user_dietary, restaurant_cuisine):
    """
    Calculate dietary preference match score.
    
    Args:
        user_dietary: User's dietary preference ("none", "vegetarian", "halal", "vegan")
        restaurant_cuisine: Restaurant's cuisine type
    
    Returns:
        Score between 0 and 1
    """
    if not user_dietary or str(user_dietary).lower() == "none":
        return 1.0  # No restrictions - all restaurants match
    
    if restaurant_cuisine is None:
        restaurant_cuisine_lower = ""
    else:
        restaurant_cuisine_lower = str(restaurant_cuisine).lower()
    
    # Heuristic: Most Pakistani/BBQ restaurants are halal
    if user_dietary.lower() == "halal":
        if restaurant_cuisine_lower in ["pakistani", "bbq", "indian"]:
            return 1.0
        else:
            return 0.7  # Assume most restaurants are halal-friendly
    
    # Vegetarian/Vegan: Some cuisines are more vegetarian-friendly
    if user_dietary.lower() in ["vegetarian", "vegan"]:
        vegetarian_friendly = ["indian", "italian", "thai", "chinese"]
        if restaurant_cuisine_lower in vegetarian_friendly:
            return 0.9
        else:
            return 0.6  # May have vegetarian options
    
    return 0.8  # Default moderate score


def filter_deals_by_preferences(deals, user_preferences):
    """
    Filter deals based on user preferences (budget, spice, dietary).
    
    Args:
        deals: List of deal dictionaries
        user_preferences: User preference dictionary
        
    Returns:
        List of filtered deals
    """
    if not deals:
        return []
        
    filtered_deals = []
    
    # Extract preferences
    budget = user_preferences.get('budget', 'medium').lower()
    user_spice = user_preferences.get('spiceLevel')
    user_dietary = user_preferences.get('dietary', 'none').lower()
    
    # Define budget limits (PKR)
    # Low: 0-500, Medium: 500-1500, High: 1500+
    min_price = 0
    max_price = float('inf')
    
    if budget == 'low':
        max_price = 500
    elif budget == 'medium':
        min_price = 500
        max_price = 1500
    elif budget == 'high':
        min_price = 1500
        
    for deal in deals:
        # 1. Price Filter
        try:
            price = float(deal.get('price', 0))
            if price > 0:  # Only filter if price matches valid range
                if not (min_price <= price <= max_price):
                    continue
        except (ValueError, TypeError):
            pass  # Skip price check if invalid
            
        # 2. Spice Level Filter
        # Only apply if both user has preference and deal has data
        if user_spice is not None and deal.get('spiceLevel') is not None:
            try:
                d_spice = int(deal.get('spiceLevel'))
                u_spice = int(user_spice)
                # Allow +/- 1 difference
                if abs(d_spice - u_spice) > 1:
                    continue
            except (ValueError, TypeError):
                pass
                
        # 3. Dietary Filter
        # Only apply if user has specific preference (not None/None)
        if user_dietary not in ['none', ''] and deal.get('dietary'):
            d_dietary = str(deal.get('dietary')).lower()
            if user_dietary != d_dietary:
                # Special case: Halal usually covers everything in Pakistan, but if specific mismatch:
                # e.g. User wants "Vegetarian", deal is "Halal" (implies meat) -> Skip?
                # For now, strict string match or simple logic
                if user_dietary == 'vegetarian' and d_dietary != 'vegetarian':
                    continue
                if user_dietary == 'vegan' and d_dietary not in ['vegan', 'vegetarian']:
                    continue
        
        filtered_deals.append(deal)
        
    return filtered_deals


def calculate_featured_bonus(restaurant_featured, deal_count):
    """
    Calculate bonus score for featured restaurants and restaurants with more deals.
    
    Args:
        restaurant_featured: Boolean indicating if restaurant is featured
        deal_count: Number of deals available
    
    Returns:
        Bonus score (0 to 0.2)
    """
    bonus = 0.0
    
    # Featured restaurant bonus
    if restaurant_featured:
        bonus += 0.1
    
    # More deals = more options = higher bonus
    if deal_count >= 5:
        bonus += 0.1
    elif deal_count >= 3:
        bonus += 0.05
    
    return min(0.2, bonus)  # Cap bonus at 0.2


def generate_explanation(restaurant, scores, user_preferences):
    """
    Generate human-readable explanation for why restaurant was recommended.
    
    Args:
        restaurant: Restaurant object
        scores: Dictionary of individual scores
        user_preferences: User preference object
    
    Returns:
        Explanation string
    """
    reasons = []
    
    # Cuisine match
    if scores['cuisine'] >= 0.7:
        if scores['cuisine'] == 1.0:
            cuisine_text = f"perfect match for your {', '.join(user_preferences.get('cuisine', []))} preferences"
            if restaurant.get('has_deal_ai_data'):
                cuisine_text += " (deal-specific cuisine)"
            reasons.append(cuisine_text)
        else:
            reasons.append(f"offers {restaurant.get('cuisine', 'food')} cuisine")
    
    # City match
    if scores['city'] == 1.0:
        reasons.append(f"located in your preferred city ({user_preferences.get('city', '')})")
    
    # Budget match
    if scores['budget'] >= 0.8:
        reasons.append("fits your budget")
    
    # Spice level
    if scores['spice'] >= 0.7:
        spice_level = user_preferences.get('spiceLevel', 3)
        # Ensure spice_level is between 1 and 5
        spice_level = max(1, min(5, int(spice_level) if spice_level else 3))
        spice_descriptions = ["mild", "mild", "moderate", "spicy", "very spicy"]
        spice_desc = spice_descriptions[spice_level - 1] if 1 <= spice_level <= 5 else "moderate"
        reasons.append(f"matches your preference for {spice_desc} food")
    
    # Featured
    if restaurant.get('featured'):
        reasons.append("featured restaurant")
    
    # Deal count
    deal_count = len(restaurant.get('deals', []))
    if deal_count >= 5:
        reasons.append(f"offers {deal_count} great deals")
    
    if not reasons:
        return f"Recommended based on overall match with your preferences"
    
    return "Recommended because " + ", ".join(reasons[:3])  # Top 3 reasons


def calculate_restaurant_score(restaurant, user_preferences):
    """
    Calculate overall recommendation score for a restaurant.
    
    This is the core content-based filtering function.
    It converts user preferences into a preference vector and
    calculates similarity with restaurant features.
    
    Args:
        restaurant: Restaurant object with name, city, cuisine, deals, featured
        user_preferences: User preference object
    
    Returns:
        Dictionary with:
        - total_score: Overall match score (0-1)
        - individual_scores: Breakdown of scores
        - explanation: Human-readable explanation
    """
    # Safely get restaurant data with defaults
    restaurant_cuisine = restaurant.get('cuisine') if isinstance(restaurant, dict) else getattr(restaurant, 'cuisine', '')
    restaurant_city = restaurant.get('city') if isinstance(restaurant, dict) else getattr(restaurant, 'city', '')
    restaurant_deals = restaurant.get('deals', []) if isinstance(restaurant, dict) else getattr(restaurant, 'deals', [])
    restaurant_featured = restaurant.get('featured', False) if isinstance(restaurant, dict) else getattr(restaurant, 'featured', False)
    
    # Check if any deals have deal-specific AI data
    # If deals have spice level, dietary, or cuisine, use those for better matching
    # We'll score based on the BEST matching deal, not just the first one
    deal_has_ai_data = False
    deal_cuisine = None
    deal_spice_level = None
    deal_dietary = None
    
    if isinstance(restaurant_deals, list) and len(restaurant_deals) > 0:
        # Find the best matching deal based on user preferences
        best_deal_match_score = 0
        best_deal = None
        
        for deal_idx, deal in enumerate(restaurant_deals):
            if isinstance(deal, dict):
                deal_match_score = 0
                
                # Check if this deal has AI data
                has_ai_data = deal.get('spiceLevel') is not None or deal.get('dietary') or deal.get('cuisine')
                
                if has_ai_data:
                    deal_has_ai_data = True
                    
                    # Score this deal based on how well it matches user preferences
                    # Cuisine match
                    deal_cuisine_val = deal.get('cuisine')
                    if deal_cuisine_val:
                        cuisine_match = calculate_cuisine_score(
                            user_preferences.get('cuisine', []),
                            deal_cuisine_val
                        )
                        deal_match_score += cuisine_match * 0.4
                    
                    # Spice level match
                    deal_spice = deal.get('spiceLevel')
                    if deal_spice is not None:
                        user_spice = user_preferences.get('spiceLevel', 3)
                        spice_diff = abs(user_spice - deal_spice)
                        spice_match = 1.0 - (spice_diff * 0.2)
                        spice_match = max(0.2, min(1.0, spice_match))
                        deal_match_score += spice_match * 0.3
                    
                    # Dietary match
                    deal_dietary_val = deal.get('dietary')
                    if deal_dietary_val:
                        dietary_match = calculate_dietary_score(
                            user_preferences.get('dietary', 'none'),
                            deal_dietary_val
                        )
                        deal_match_score += dietary_match * 0.3
                    
                    # Debug logging for deals with AI data
                    restaurant_name = restaurant.get('name', 'Unknown')
                    deal_title = deal.get('title', f'Deal {deal_idx+1}')
                    print(f"[AI Service] Deal '{deal_title}' at {restaurant_name}: AI data (spice={deal_spice}, dietary={deal_dietary_val}, cuisine={deal_cuisine_val}), match_score={deal_match_score:.3f}")
                    
                    # If this deal scores better, use it
                    if deal_match_score > best_deal_match_score:
                        best_deal_match_score = deal_match_score
                        best_deal = deal
                        if deal.get('cuisine'):
                            deal_cuisine = deal.get('cuisine')
                        if deal.get('spiceLevel') is not None:
                            deal_spice_level = deal.get('spiceLevel')
                        if deal.get('dietary'):
                            deal_dietary = deal.get('dietary')
                        print(f"[AI Service] New best deal selected: '{deal_title}' with score {deal_match_score:.3f}")
        
        # If no deal with AI data found, check all deals for any AI fields
        if not deal_has_ai_data:
            for deal in restaurant_deals:
                if isinstance(deal, dict):
                    if deal.get('spiceLevel') is not None or deal.get('dietary') or deal.get('cuisine'):
                        deal_has_ai_data = True
                        if deal.get('cuisine'):
                            deal_cuisine = deal.get('cuisine')
                        if deal.get('spiceLevel') is not None:
                            deal_spice_level = deal.get('spiceLevel')
                        if deal.get('dietary'):
                            deal_dietary = deal.get('dietary')
                        break
    
    # Use deal-level data if available, otherwise fall back to restaurant data
    effective_cuisine = deal_cuisine if deal_cuisine else restaurant_cuisine
    effective_spice_level = deal_spice_level if deal_spice_level is not None else None
    effective_dietary = deal_dietary if deal_dietary else None
    
    # Calculate individual feature scores
    cuisine_score = calculate_cuisine_score(
        user_preferences.get('cuisine', []),
        effective_cuisine
    )
    
    city_score = calculate_city_score(
        user_preferences.get('city', ''),
        restaurant_city
    )
    
    budget_score = calculate_budget_score(
        user_preferences.get('budget', 'medium'),
        restaurant_deals if isinstance(restaurant_deals, list) else []
    )
    
    # For spice score, use deal-level if available, otherwise infer from cuisine
    if effective_spice_level is not None:
        # Use actual deal spice level
        user_spice = user_preferences.get('spiceLevel', 3)
        spice_diff = abs(user_spice - effective_spice_level)
        spice_score = 1.0 - (spice_diff * 0.2)
        spice_score = max(0.2, min(1.0, spice_score))
    else:
        # Fall back to cuisine-based inference
        spice_score = calculate_spice_score(
            user_preferences.get('spiceLevel', 3),
            effective_cuisine
        )
    
    # For dietary score, use deal-level if available
    if effective_dietary:
        dietary_score = calculate_dietary_score(
            user_preferences.get('dietary', 'none'),
            effective_dietary  # Use deal dietary instead of cuisine
        )
    else:
        dietary_score = calculate_dietary_score(
            user_preferences.get('dietary', 'none'),
            effective_cuisine
        )
    
    # Calculate bonus for featured restaurants and deal count
    featured_bonus = calculate_featured_bonus(
        restaurant_featured,
        len(restaurant_deals) if isinstance(restaurant_deals, list) else 0
    )
    
    # Additional bonus if restaurant has multiple deals with AI data
    # This encourages restaurants with more detailed deal information
    if deal_has_ai_data and isinstance(restaurant_deals, list):
        deals_with_ai_count = sum(1 for d in restaurant_deals 
                                 if isinstance(d, dict) and (d.get('spiceLevel') is not None or d.get('dietary') or d.get('cuisine')))
        if deals_with_ai_count >= 3:
            featured_bonus += 0.05  # Extra bonus for 3+ deals with AI data
        elif deals_with_ai_count >= 2:
            featured_bonus += 0.02  # Small bonus for 2+ deals with AI data
    
    # Weighted combination of scores
    # These weights determine the importance of each feature
    weights = {
        'cuisine': 0.30,    # Most important - cuisine preference
        'city': 0.20,       # Location is important
        'budget': 0.20,     # Budget constraints
        'spice': 0.15,      # Spice level preference
        'dietary': 0.10,    # Dietary restrictions
        'bonus': 0.05       # Featured/deals bonus
    }
    
    # Calculate weighted total score
    total_score = (
        weights['cuisine'] * cuisine_score +
        weights['city'] * city_score +
        weights['budget'] * budget_score +
        weights['spice'] * spice_score +
        weights['dietary'] * dietary_score +
        weights['bonus'] * featured_bonus * 10  # Scale bonus (0-0.2) to 0-2
    )
    
    # Normalize to 0-1 range (in case of overflow)
    total_score = min(1.0, max(0.0, total_score))
    
    # Generate explanation
    individual_scores = {
        'cuisine': round(cuisine_score, 2),
        'city': round(city_score, 2),
        'budget': round(budget_score, 2),
        'spice': round(spice_score, 2),
        'dietary': round(dietary_score, 2),
        'bonus': round(featured_bonus, 2)
    }
    
    # Create a safe restaurant dict for explanation
    safe_restaurant = {
        'cuisine': effective_cuisine,  # Use effective cuisine (deal or restaurant)
        'city': restaurant_city,
        'deals': restaurant_deals if isinstance(restaurant_deals, list) else [],
        'featured': restaurant_featured,
        'has_deal_ai_data': deal_has_ai_data  # Flag to indicate deal-specific data was used
    }
    
    explanation = generate_explanation(safe_restaurant, individual_scores, user_preferences)
    
    return {
        'total_score': round(total_score, 3),
        'individual_scores': individual_scores,
        'explanation': explanation
    }


def recommend_restaurants(user_preferences, restaurants):
    """
    HYBRID RECOMMENDATION FUNCTION: Rule-Based + Machine Learning
    
    This function combines:
    1. Rule-based scoring (60% weight) - Domain knowledge, explainable rules
    2. ML-based scoring (40% weight) - Cosine similarity, pattern recognition
    
    Why Hybrid?
    - Rule-based: Captures explicit business logic (budget, dietary restrictions)
    - ML-based: Discovers implicit patterns and similarities
    - Combined: Better accuracy than either alone
    
    Algorithm Steps:
    1. Get ML similarity scores using Cosine Similarity
    2. Get rule-based scores using domain knowledge
    3. Combine: final_score = 0.6 * rule_score + 0.4 * ml_score
    4. Sort by final score (descending)
    5. Return top 5 recommendations
    
    Args:
        user_preferences: Dictionary with user preferences
        restaurants: List of restaurant objects
    
    Returns:
        List of top 5 recommended restaurants with scores and explanations
    """
    print(f"[AI Service] Processing {len(restaurants)} restaurants for recommendations")
    print(f"[AI Service] Using HYBRID approach: 60% rule-based + 40% ML (Cosine Similarity)")
    
    # Step 1: Get ML scores using Cosine Similarity
    ml_scores = ml_recommend(user_preferences, restaurants)
    
    scored_restaurants = []
    
    # Step 2: Calculate rule-based scores and combine with ML scores
    for idx, restaurant in enumerate(restaurants):
        restaurant_name = restaurant.get('name', f'Restaurant {idx+1}')
        
        # Filter deals based on user preferences
        original_deals = restaurant.get('deals', [])
        matching_deals = filter_deals_by_preferences(original_deals, user_preferences)
        
        # Create a copy of restaurant with only matching deals for scoring and return
        restaurant_for_scoring = restaurant.copy()
        restaurant_for_scoring['deals'] = matching_deals
        
        deal_count = len(matching_deals)
        deals_with_ai = sum(1 for d in matching_deals 
                           if isinstance(d, dict) and (d.get('spiceLevel') is not None or d.get('dietary') or d.get('cuisine')))
        
        # Skip restaurants with no matching deals
        if not matching_deals and original_deals:
            continue
        
        # Step 3: Calculate rule-based score
        rule_score_data = calculate_restaurant_score(restaurant_for_scoring, user_preferences)
        rule_score = rule_score_data['total_score']
        
        # Step 4: Get ML score (default to 0 if ML failed or restaurant not in ML results)
        ml_score = ml_scores.get(idx, 0.0)
        
        # Step 5: HYBRID SCORING - Combine rule-based and ML scores
        # 60% rule-based (domain knowledge) + 40% ML (pattern recognition)
        final_score = 0.6 * rule_score + 0.4 * ml_score
        
        # Ensure score is in valid range
        final_score = max(0.0, min(1.0, final_score))
        
        scored_restaurants.append({
            'restaurant': restaurant_for_scoring,
            'match_score': round(final_score, 3),
            'match_percentage': round(final_score * 100, 1),
            'explanation': rule_score_data['explanation'],
            'score_breakdown': {
                **rule_score_data['individual_scores'],
                'rule_based_score': round(rule_score, 3),
                'ml_score': round(ml_score, 3),
                'final_hybrid_score': round(final_score, 3)
            }
        })
    
    # Step 6: Sort by final hybrid score (descending)
    scored_restaurants.sort(key=lambda x: x['match_score'], reverse=True)
    
    # Log top recommendations with hybrid scores
    print(f"[AI Service] Top 5 recommendations (Hybrid: Rule + ML):")
    for idx, rec in enumerate(scored_restaurants[:5]):
        restaurant_name = rec['restaurant'].get('name', 'Unknown')
        rule_score = rec['score_breakdown'].get('rule_based_score', 0)
        ml_score = rec['score_breakdown'].get('ml_score', 0)
        final_score = rec['match_percentage']
        print(f"  {idx+1}. {restaurant_name}: {final_score}% (Rule: {rule_score:.3f}, ML: {ml_score:.3f})")
    
    # Return top 5 recommendations
    return scored_restaurants[:5]


# ============================================================================
# FLASK API ENDPOINTS
# ============================================================================

@app.route('/')
def home():
    """Health check endpoint"""
    return jsonify({
        "service": "DineMate AI Recommendation Service",
        "status": "running",
        "algorithm": "Hybrid: Rule-Based + ML (Cosine Similarity)",
        "ml_model": "Unsupervised Content-Based Filtering",
        "mongodb_connected": restaurants_collection is not None
    })


def fetch_restaurants_from_mongodb():
    """
    Fetch all restaurants and deals directly from MongoDB.
    This ensures we always get the latest data without caching.
    
    Returns:
        List of restaurant dictionaries with all deals
    """
    if restaurants_collection is None:
        raise Exception("MongoDB connection not available")
    
    print(f"[AI Service] Fetching fresh data from MongoDB at {datetime.now()}")
    
    # Fetch all restaurants with all their deals
    restaurants_cursor = restaurants_collection.find({})
    restaurants = []
    
    for restaurant in restaurants_cursor:
        # Convert ObjectId to string for JSON serialization
        restaurant_dict = {
            '_id': str(restaurant.get('_id', '')),
            'name': restaurant.get('name', ''),
            'city': restaurant.get('city', ''),
            'cuisine': restaurant.get('cuisine', ''),
            'featured': restaurant.get('featured', False),
            'deals': []
        }
        
        # Process all deals for this restaurant
        deals = restaurant.get('deals', [])
        for deal in deals:
            deal_dict = {
                '_id': str(deal.get('_id', '')) if deal.get('_id') else None,
                'title': deal.get('title', ''),
                'price': deal.get('price', 0),
                'spiceLevel': deal.get('spiceLevel'),
                'dietary': deal.get('dietary'),
                'cuisine': deal.get('cuisine'),
                'featured': deal.get('featured', False)
            }
            restaurant_dict['deals'].append(deal_dict)
        
        restaurants.append(restaurant_dict)
    
    print(f"[AI Service] Fetched {len(restaurants)} restaurants with {sum(len(r['deals']) for r in restaurants)} total deals from MongoDB")
    
    # Log deals with AI data
    total_deals_with_ai = 0
    for restaurant in restaurants:
        deals_with_ai = sum(1 for d in restaurant['deals'] 
                           if d.get('spiceLevel') is not None or d.get('dietary') or d.get('cuisine'))
        if deals_with_ai > 0:
            total_deals_with_ai += deals_with_ai
            print(f"[AI Service] {restaurant['name']}: {len(restaurant['deals'])} deals, {deals_with_ai} with AI data")
    
    print(f"[AI Service] Total deals with AI data: {total_deals_with_ai}")
    
    return restaurants


@app.route('/api/recommend', methods=['POST'])
def recommend():
    """
    Main recommendation endpoint with ML-based Content-Based Filtering.
    
    This endpoint:
    1. Fetches FRESH data from MongoDB on EVERY request (no caching)
    2. Uses HYBRID approach: 60% rule-based + 40% ML (Cosine Similarity)
    3. Returns top 5 recommendations with explainable scores
    
    ML Algorithm: Cosine Similarity (Unsupervised Content-Based Filtering)
    - Converts restaurants and user preferences into feature vectors
    - Uses cosine similarity to find restaurants with similar feature patterns
    - Combines ML scores with rule-based scores for better accuracy
    
    Request Body:
    {
        "preferences": {
            "cuisine": ["Pakistani", "BBQ"],
            "spiceLevel": 4,
            "budget": "medium",
            "dietary": "halal",
            "city": "Multan"
        },
        "userId": "optional_user_id"  # If provided, will fetch preferences from MongoDB
    }
    
    Returns:
    {
        "success": true,
        "recommendations": [
            {
                "restaurant": {...},
                "match_score": 0.85,
                "match_percentage": 85.0,
                "explanation": "...",
                "score_breakdown": {
                    "rule_based_score": 0.80,
                    "ml_score": 0.92,
                    "final_hybrid_score": 0.85
                }
            }
        ],
        "algorithm": "Hybrid: Rule-Based + ML (Cosine Similarity)",
        "ml_model": "Unsupervised Content-Based Filtering"
    }
    """
    try:
        # Check MongoDB connection - CRITICAL for fresh data
        if restaurants_collection is None:
            return jsonify({
                "success": False,
                "message": "MongoDB connection not available. Python AI service cannot fetch data. Please check MongoDB connection and restart the service."
            }), 503
        
        data = request.get_json() or {}
        
        # Fetch preferences - either from request or MongoDB
        preferences = data.get('preferences', {})
        userId = data.get('userId')
        
        # If userId provided and no preferences, try to fetch from MongoDB
        if userId and not preferences and user_preferences_collection is not None:
            print(f"[AI Service] Fetching preferences for user: {userId}")
            try:
                from bson import ObjectId
                # Handle both string and ObjectId formats
                try:
                    user_id_obj = ObjectId(userId) if isinstance(userId, str) else userId
                except:
                    user_id_obj = userId
                user_pref = user_preferences_collection.find_one({'userId': user_id_obj})
                if user_pref:
                    preferences = {
                        'cuisine': user_pref.get('cuisine', []),
                        'spiceLevel': user_pref.get('spiceLevel', 3),
                        'budget': user_pref.get('budget', 'medium'),
                        'dietary': user_pref.get('dietary', 'none'),
                        'city': user_pref.get('city', '')
                    }
                    print(f"[AI Service] Loaded preferences from MongoDB: {preferences}")
            except Exception as e:
                print(f"[AI Service] Error fetching user preferences: {e}")
        
        if not preferences:
            return jsonify({
                "success": False,
                "message": "User preferences are required"
            }), 400
        
        # CRITICAL: Fetch restaurants directly from MongoDB (fresh data every time)
        # This ensures newly added restaurants and deals are immediately available
        print(f"[AI Service] ========================================")
        print(f"[AI Service] Fetching FRESH data from MongoDB at {datetime.now()}")
        print(f"[AI Service] ========================================")
        
        restaurants = fetch_restaurants_from_mongodb()
        
        if not restaurants or len(restaurants) == 0:
            return jsonify({
                "success": False,
                "message": "No restaurants found in database"
            }), 404
        
        # Get recommendations using HYBRID approach (Rule-Based + ML)
        print(f"[AI Service] Generating recommendations using HYBRID ML approach...")
        print(f"[AI Service] Algorithm: 60% Rule-Based + 40% ML (Cosine Similarity)")
        
        recommendations = recommend_restaurants(preferences, restaurants)
        
        if not recommendations:
            return jsonify({
                "success": False,
                "message": "No matching recommendations found. Try adjusting your preferences."
            }), 404
        
        return jsonify({
            "success": True,
            "recommendations": recommendations,
            "algorithm": "Hybrid: Rule-Based + ML (Cosine Similarity)",
            "ml_model": "Unsupervised Content-Based Filtering",
            "data_source": "MongoDB (direct fetch - fresh data)",
            "fetch_time": datetime.now().isoformat(),
            "total_restaurants_analyzed": len(restaurants),
            "recommendations_returned": len(recommendations),
            "scoring_method": "Hybrid: 60% rule-based + 40% ML cosine similarity"
        })
    
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"[ERROR] Error in recommendation endpoint: {str(e)}")
        print(f"[ERROR] Traceback: {error_trace}")
        return jsonify({
            "success": False,
            "message": f"Error processing recommendation: {str(e)}",
            "error_type": type(e).__name__,
            "details": "Check Python AI service logs for more information"
        }), 500


if __name__ == '__main__':
    # Run Flask app
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

