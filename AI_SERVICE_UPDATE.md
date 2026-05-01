# AI Service Update - Direct MongoDB Access

## ✅ Changes Made

The Python AI service now **fetches data directly from MongoDB** every time a recommendation is requested. This eliminates caching issues and ensures you always get the latest restaurants and deals.

## What Changed

### 1. Python Service (`ai_service/app.py`)
- ✅ Added direct MongoDB connection using `pymongo`
- ✅ Fetches all restaurants and deals from MongoDB on every request
- ✅ No caching - always fresh data
- ✅ Logs detailed information about fetched data

### 2. Node.js Backend (`server/controllers/recommendationController.js`)
- ✅ Simplified to only send user preferences
- ✅ Python service now handles all data fetching
- ✅ Reduced data transfer (only preferences sent, not all restaurants)

### 3. Dependencies
- ✅ Added `pymongo` for MongoDB access
- ✅ Added `python-dotenv` for environment variables

## Setup Instructions

### 1. Update `.env` File

Edit `ai_service/.env` and make sure it matches your MongoDB connection:

```env
MONGO_URL=mongodb://localhost:27017
MONGO_DB_NAME=resturantfinder
PORT=5000
```

**Important**: If your Node.js server uses a different MongoDB connection string (e.g., MongoDB Atlas with authentication), copy the same `MONGO_URL` from your `server/.env` file to `ai_service/.env`.

### 2. Restart Python Service

The Python service has been restarted with the new code. If you need to restart it manually:

```bash
cd ai_service
python app.py
```

You should see:
```
✅ MongoDB connected to database: resturantfinder
✅ MongoDB connection verified
```

### 3. Test the System

1. Add a new deal with AI data in Admin panel
2. Click "🤖 AI Recommendations" on home page
3. Click "🔄 Refresh" button
4. **New deals should now appear immediately!**

## How It Works Now

1. **User clicks AI Recommendations** → Frontend calls Node.js backend
2. **Node.js backend** → Sends only user preferences to Python service
3. **Python service** → Fetches ALL restaurants and deals directly from MongoDB
4. **Python service** → Processes recommendations with fresh data
5. **Python service** → Returns top 5 recommendations

## Benefits

✅ **No Caching**: Data is fetched fresh from MongoDB every time  
✅ **Always Up-to-Date**: New deals appear immediately  
✅ **Better Performance**: Python service handles data fetching efficiently  
✅ **Detailed Logging**: See exactly what data is being processed

## Troubleshooting

### MongoDB Connection Error

If you see `❌ MongoDB connection error`:

1. Check MongoDB is running
2. Verify `MONGO_URL` in `ai_service/.env` matches your MongoDB connection
3. If using MongoDB Atlas, ensure the connection string includes authentication
4. Check `MONGO_DB_NAME` matches your database name (default: `resturantfinder`)

### No Restaurants Found

If Python service says "No restaurants found":

1. Verify restaurants exist in MongoDB
2. Check collection name is `restaurants` (Mongoose uses lowercase plural)
3. Verify database name in `.env` is correct

### Still Seeing Old Data

1. Make sure Python service was restarted after code changes
2. Check Python service console for MongoDB connection messages
3. Verify new deals are saved with AI fields (spice level, dietary, cuisine)
4. Check Python service logs to see if new deals are being fetched

## Logs to Watch

When you request recommendations, you should see in Python service console:

```
[AI Service] Fetching fresh data from MongoDB at 2026-01-13...
[AI Service] Fetched 5 restaurants with 14 total deals from MongoDB
[AI Service] Restaurant Name: 8 deals, 4 with AI data
[AI Service] Total deals with AI data: 4
[AI Service] Processing 5 restaurants for recommendations
[AI Service] Top 5 recommendations:
  1. Restaurant Name - 85.0% match
```

These logs confirm that:
- ✅ Data is being fetched from MongoDB
- ✅ Deals with AI data are being detected
- ✅ Recommendations are being generated

