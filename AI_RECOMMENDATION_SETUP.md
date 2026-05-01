# AI Restaurant Recommendation System - Setup Guide

This document explains how to set up and use the AI-based restaurant recommendation system for DineMate.

## System Architecture

The AI recommendation system consists of three main components:

1. **Database Layer (MongoDB)**: `UserPreference` collection stores user food preferences
2. **Backend (Node.js/Express)**: API endpoints for preferences and recommendations
3. **AI Service (Python/Flask)**: Content-based filtering algorithm for recommendations

## Setup Instructions

### 1. Backend Setup

The backend dependencies have been updated. Install them:

```bash
cd server
npm install
```

This will install `axios` which is needed to communicate with the Python AI service.

### 2. Python AI Service Setup

1. Navigate to the AI service directory:
```bash
cd ai_service
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the AI service:
```bash
python app.py
```

The service will run on `http://localhost:5000` by default.

### 3. Environment Variables

Make sure your `.env` file in the `server` directory includes:

```env
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=7000
PYTHON_AI_SERVICE_URL=http://localhost:5000  # Optional, defaults to localhost:5000
```

### 4. Frontend

The frontend has been updated with the AI recommendation feature. No additional setup is needed.

## How It Works

### Algorithm: Content-Based Filtering

The recommendation system uses a **content-based filtering** approach:

1. **Preference Vector**: User preferences (cuisine, spice level, budget, dietary, city) are converted into a preference vector
2. **Feature Matching**: Each restaurant is scored based on how well it matches the user's preferences
3. **Weighted Scoring**: Different features have different weights:
   - Cuisine: 30% (most important)
   - City: 20%
   - Budget: 20%
   - Spice Level: 15%
   - Dietary: 10%
   - Featured/Deals Bonus: 5%
4. **Ranking**: Restaurants are sorted by total match score
5. **Top 5 Results**: Returns the top 5 recommendations with explanations

### API Endpoints

#### Save/Update Preferences
```
POST /api/user/preferences
Headers: Authorization: Bearer <token>
Body: {
  "cuisine": ["Pakistani", "BBQ"],
  "spiceLevel": 4,
  "budget": "medium",
  "dietary": "halal",
  "city": "Multan"
}
```

#### Get Preferences
```
GET /api/user/preferences
Headers: Authorization: Bearer <token>
```

#### Get AI Recommendations
```
GET /api/ai/recommendations
Headers: Authorization: Bearer <token>
```

## Usage Flow

1. User clicks "🤖 AI Recommendations" button on the home page
2. If user has no preferences, a modal appears to collect preferences
3. Preferences are saved to `UserPreference` collection
4. Backend fetches user preferences and all restaurants
5. Data is sent to Python AI service
6. AI service calculates match scores and returns top 5 recommendations
7. Frontend displays recommendations with:
   - Match percentage
   - Explanation of why it was recommended
   - Restaurant details
   - Top deal preview

## Database Schema

### UserPreference Collection

```javascript
{
  userId: ObjectId (reference to User),
  cuisine: [String],  // e.g., ["Pakistani", "BBQ"]
  spiceLevel: Number,  // 1-5
  budget: String,      // "low", "medium", "high"
  dietary: String,     // "none", "vegetarian", "halal", "vegan"
  city: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Important**: The User collection is NOT modified. All preferences are stored separately.

## Testing

1. Start MongoDB
2. Start the Node.js backend: `cd server && npm start`
3. Start the Python AI service: `cd ai_service && python app.py`
4. Start the React frontend: `cd frontend && npm start`
5. Log in to the application
6. Click "🤖 AI Recommendations" button
7. Fill in preferences and submit
8. View AI-powered recommendations

## Troubleshooting

### Python Service Not Responding
- Check if the service is running on port 5000
- Verify `PYTHON_AI_SERVICE_URL` in backend `.env` file
- Check Python service logs for errors

### No Recommendations Returned
- Ensure user has set preferences (at least one cuisine)
- Verify restaurants exist in the database
- Check backend logs for API errors

### Preferences Not Saving
- Verify JWT token is valid
- Check MongoDB connection
- Review backend logs for validation errors

## For FYP Viva

### Key Points to Explain:

1. **Content-Based Filtering**: Explain how user preferences are converted to vectors and matched with restaurant features
2. **Weighted Scoring**: Explain the importance weights for different features
3. **Explainable AI**: Each recommendation includes an explanation of why it was recommended
4. **Separation of Concerns**: Preferences stored separately from User collection
5. **Microservices Architecture**: Node.js backend communicates with Python AI service via HTTP

### Algorithm Complexity:
- Time Complexity: O(n) where n is the number of restaurants
- Space Complexity: O(n) for storing restaurant data
- Simple, explainable algorithm suitable for FYP presentation

## Files Created/Modified

### New Files:
- `server/models/UserPreference.js` - MongoDB schema
- `server/controllers/preferenceController.js` - Preference CRUD
- `server/controllers/recommendationController.js` - AI recommendation endpoint
- `server/routes/preferenceRoutes.js` - Preference routes
- `server/routes/recommendationRoutes.js` - Recommendation routes
- `ai_service/app.py` - Python Flask AI service
- `ai_service/requirements.txt` - Python dependencies
- `ai_service/README.md` - AI service documentation

### Modified Files:
- `server/index.js` - Added new routes
- `server/package.json` - Added axios dependency
- `frontend/src/pages/HomePage.jsx` - Added AI recommendation UI
- `frontend/src/styles/HomePage.css` - Added AI recommendation styles

