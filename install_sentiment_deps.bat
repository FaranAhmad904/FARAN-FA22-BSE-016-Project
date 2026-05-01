@echo off
echo Installing Python dependencies for AI service...
cd e:\project\ai_service
pip install -r requirements.txt

echo.
echo Installing Node.js dependencies (axios should already be installed)...
cd e:\project\server
npm install

echo.
echo Installing Frontend dependencies...
cd e:\project\frontend
npm install

echo.
echo ✅ All dependencies installed successfully!
echo.
echo To start the system:
echo 1. Start AI service: cd ai_service && python app.py
echo 2. Start Node server: cd server && npm start  
echo 3. Start Frontend: cd frontend && npm start
echo.
echo Then test sentiment analysis at: http://localhost:3000/sentiment-analysis
pause
