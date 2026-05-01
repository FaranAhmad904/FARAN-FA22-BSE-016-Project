# ML-Based Recommendation System - Implementation Summary

## ✅ Implementation Complete

The DineMate AI recommendation system has been upgraded from rule-based to a **proper ML-based content-based filtering system using Cosine Similarity**.

## 🎯 Key Features Implemented

### 1. Machine Learning Components

#### **Cosine Similarity Algorithm**
- **Why Cosine Similarity?**
  - Measures similarity based on direction, not magnitude
  - Perfect for recommendation systems where we care about preference patterns
  - Mathematical foundation: cos(θ) = (A · B) / (||A|| * ||B||)
  - Returns values between -1 and 1 (normalized to 0-1 for our use case)

#### **Feature Engineering**
- **One-Hot Encoding** for categorical features:
  - Cuisine types
  - Cities
  - Dietary preferences
- **Numerical Features**:
  - Budget category (derived from deal prices: 0=low, 1=medium, 2=high)
  - Spice level (normalized 0-1 scale)

#### **ML Functions Implemented**
1. `prepare_feature_matrix(restaurants)` - Converts restaurants to feature vectors
2. `user_to_vector(user_preferences, ...)` - Converts user preferences to feature vector
3. `ml_recommend(user_preferences, restaurants)` - Calculates cosine similarity scores

### 2. Hybrid Scoring System

**Formula**: `final_score = 0.6 * rule_score + 0.4 * ml_score`

- **60% Rule-Based**: Domain knowledge, explicit business logic
- **40% ML-Based**: Pattern recognition, implicit similarities
- **Why Hybrid?**: Combines explainability of rules with pattern discovery of ML

### 3. Fresh Data Fetching

✅ **MongoDB is queried on EVERY request**
- No caching
- New restaurants/deals appear immediately
- `fetch_restaurants_from_mongodb()` called in `/api/recommend` endpoint

### 4. Error Handling

✅ **Proper error handling**:
- Returns 503 if MongoDB not connected
- Returns 500 with detailed error messages
- No mock/cached recommendations
- Backend throws error if Python service unavailable

### 5. Logging

✅ **Comprehensive logging**:
- ML model execution logs
- Top 5 cosine similarity scores
- MongoDB fetch timestamps
- Hybrid score breakdowns

## 📊 Algorithm Flow

```
1. User clicks "AI Recommendations"
   ↓
2. Frontend sends preferences to Node.js backend
   ↓
3. Backend sends preferences to Python AI service
   ↓
4. Python service fetches FRESH data from MongoDB
   ↓
5. ML Feature Engineering:
   - Convert restaurants to feature vectors
   - Convert user preferences to feature vector
   ↓
6. Calculate Cosine Similarity (ML scores)
   ↓
7. Calculate Rule-Based scores
   ↓
8. Hybrid Scoring: 60% rule + 40% ML
   ↓
9. Sort by final score
   ↓
10. Return top 5 recommendations
```

## 🔬 ML Model Details

### Model Type
- **Unsupervised Content-Based Filtering**
- **No training required** - works directly with feature vectors
- **No deep learning** - explainable, suitable for FYP

### Features Used
1. **Cuisine** (one-hot encoded)
2. **City** (one-hot encoded)
3. **Budget Category** (numerical, 0-1)
4. **Spice Level** (numerical, 0-1)
5. **Dietary** (one-hot encoded)

### Why No Deep Learning?
- Small dataset (FYP project)
- ML is more explainable
- Faster inference
- No GPU required
- Easier to debug and present in viva

## 📝 Code Structure

### ML Functions Location
- `prepare_feature_matrix()` - Lines ~130-246
- `user_to_vector()` - Lines ~249-310
- `ml_recommend()` - Lines ~313-380
- `recommend_restaurants()` - Lines ~963-1058 (Hybrid scoring)

### Key Files Modified
- `ai_service/app.py` - Main ML implementation
- `ai_service/requirements.txt` - Added scikit-learn, numpy
- `server/controllers/recommendationController.js` - Error handling

## 🧪 Testing

### Test the ML System

1. **Start Python Service**:
   ```bash
   cd ai_service
   python app.py
   ```

2. **Check Logs** - You should see:
   ```
   [ML] Preparing feature matrix for machine learning...
   [ML] Feature matrix shape: (5, 15)
   [ML] Running machine learning recommendation algorithm...
   [ML] Top 5 cosine similarity scores:
   [AI Service] Using HYBRID approach: 60% rule-based + 40% ML
   ```

3. **Test Recommendations**:
   - Click "🤖 AI Recommendations" on home page
   - Check Python console for ML logs
   - Verify hybrid scores in response

## 📚 FYP Viva Points

### What to Explain

1. **Why Cosine Similarity?**
   - Measures similarity in multi-dimensional space
   - Perfect for content-based filtering
   - Returns interpretable scores (0-1)

2. **Why ML?**
   - Discovers implicit patterns
   - Handles complex feature interactions
   - More accurate than pure rule-based

3. **Why Hybrid?**
   - Rule-based: Explicit business logic
   - ML: Pattern discovery
   - Combined: Best of both worlds

4. **Why No Deep Learning?**
   - Small dataset
   - Explainability requirement
   - Faster inference
   - No GPU needed

5. **Feature Engineering**
   - One-hot encoding for categorical data
   - Normalization for numerical data
   - Feature vector representation

## 🔧 Dependencies

```txt
Flask==3.0.0
flask-cors==4.0.0
pymongo==4.6.1
python-dotenv==1.0.0
scikit-learn==1.5.2
numpy==1.26.4
```

Install with:
```bash
pip install -r requirements.txt
```

## ✅ Verification Checklist

- [x] ML functions implemented (prepare_feature_matrix, user_to_vector, ml_recommend)
- [x] Cosine similarity used for ML scoring
- [x] Hybrid scoring (60% rule + 40% ML)
- [x] MongoDB fetched fresh on every request
- [x] Error handling for Python service unavailable
- [x] Comprehensive logging
- [x] Backward compatible API
- [x] Explainable code with comments
- [x] No deep learning (as required)
- [x] Requirements.txt updated

## 🚀 Next Steps

1. **Install dependencies**:
   ```bash
   cd ai_service
   pip install -r requirements.txt
   ```

2. **Start Python service**:
   ```bash
   python app.py
   ```

3. **Test recommendations**:
   - Add new deals with AI data
   - Request recommendations
   - Verify ML scores in logs

The system is now a proper ML-based recommendation system suitable for FYP evaluation!

