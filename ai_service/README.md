# DineMate AI Recommendation Service

Python Flask service implementing content-based filtering for restaurant recommendations.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create a `.env` file in the `ai_service` directory:
```env
MONGO_URL=mongodb://localhost:27017
MONGO_DB_NAME=resturantfinder
PORT=5000
```

**Important**: Make sure `MONGO_URL` matches your Node.js server's MongoDB connection string. If your Node.js server uses a different connection string (e.g., with authentication), use the same one here.

3. Run the service:
```bash
python app.py
```

The service will run on `http://localhost:5000` by default.

## Features

✅ **Direct MongoDB Access**: Fetches restaurants and deals directly from MongoDB every time  
✅ **No Caching**: Always returns fresh, up-to-date data  
✅ **Deal-Level AI Data**: Uses spice level, dietary, and cuisine from individual deals  
✅ **Best Match Selection**: Evaluates all deals and uses the best matching one

## API Endpoints

### POST /api/recommend
Get AI-powered restaurant recommendations based on user preferences.

**Request Body:**
```json
{
  "preferences": {
    "cuisine": ["Pakistani", "BBQ"],
    "spiceLevel": 4,
    "budget": "medium",
    "dietary": "halal",
    "city": "Multan"
  },
  "userId": "optional_user_id"
}
```

**Response:**
```json
{
  "success": true,
  "recommendations": [
    {
      "restaurant": {...},
      "match_score": 0.85,
      "match_percentage": 85.0,
      "explanation": "Recommended because...",
      "score_breakdown": {...}
    }
  ],
  "data_source": "MongoDB (direct fetch)",
  "fetch_time": "2026-01-13T...",
  "total_restaurants_analyzed": 5,
  "recommendations_returned": 5
}
```

## How It Works

1. **Direct MongoDB Fetch**: Every request fetches fresh data from MongoDB
2. **Deal Evaluation**: Checks all deals for AI-specific fields (spice level, dietary, cuisine)
3. **Best Match Selection**: Uses the deal that best matches user preferences
4. **Content-Based Scoring**: Scores restaurants using weighted feature similarity
5. **Top 5 Results**: Returns the top 5 recommendations with explanations

## Troubleshooting

### MongoDB Connection Error
- Check that MongoDB is running
- Verify `MONGO_URL` in `.env` matches your MongoDB connection string
- Ensure `MONGO_DB_NAME` matches your database name (default: `resturantfinder`)

### No Restaurants Found
- Verify restaurants exist in MongoDB
- Check database name is correct
- Ensure collection name is `restaurants`
