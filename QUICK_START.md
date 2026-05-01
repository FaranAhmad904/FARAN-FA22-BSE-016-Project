# Quick Start Guide - AI Recommendation System

## Fixed Issues

✅ **Duplicate Index Warning**: Fixed the duplicate index warning in `UserPreference` model by removing redundant index definition.

✅ **Python Service Connection**: The Python AI service needs to be running for recommendations to work.

## Starting the Services

### Option 1: Manual Start (Recommended for Development)

**Terminal 1 - Start Node.js Backend:**
```bash
cd server
npm start
```

**Terminal 2 - Start Python AI Service:**
```bash
cd ai_service
python app.py
```

**Terminal 3 - Start React Frontend:**
```bash
cd frontend
npm start
```

### Option 2: Using Batch Script (Windows)

Double-click `start_ai_service.bat` to start the Python AI service in a separate window.

## Verification

1. **Backend**: Should show `🚀 Server running on http://localhost:7000`
2. **Python AI Service**: Should show `Running on http://0.0.0.0:5000` or similar
3. **Frontend**: Should open at `http://localhost:3000`

## Testing the AI Recommendation

1. Log in to the application
2. Click the "🤖 AI Recommendations" button
3. Fill in your preferences:
   - Select at least one cuisine
   - Set spice level (1-5)
   - Choose budget range
   - Select dietary preference
   - Choose preferred city
4. Click "Get AI Recommendations"
5. View your personalized recommendations!

## Troubleshooting

### Error: "Python AI service error: connect ECONNREFUSED ::1:5000"

**Solution**: The Python AI service is not running. Start it using:
```bash
cd ai_service
python app.py
```

### Error: "ModuleNotFoundError: No module named 'flask'"

**Solution**: Install Python dependencies:
```bash
cd ai_service
pip install -r requirements.txt
```

### Warning: "Duplicate schema index on {"userId":1}"

**Solution**: Already fixed! The duplicate index has been removed from `UserPreference` model.

## Ports Used

- **Backend (Node.js)**: `http://localhost:7000`
- **AI Service (Python)**: `http://localhost:5000`
- **Frontend (React)**: `http://localhost:3000`

Make sure these ports are not being used by other applications.

