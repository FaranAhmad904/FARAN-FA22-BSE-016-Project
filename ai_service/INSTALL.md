# Installation Guide - AI Service

If you're getting `ModuleNotFoundError: No module named 'pymongo'`, follow these steps:

## Quick Fix

1. **Open a new terminal/command prompt** in the `ai_service` directory

2. **Install required packages:**
   ```bash
   python -m pip install Flask flask-cors pymongo python-dotenv
   ```

3. **Verify installation:**
   ```bash
   python check_setup.py
   ```

4. **Start the service:**
   ```bash
   python app.py
   ```

## Alternative: Use the Batch Script

Double-click `start_service.bat` - it will automatically:
- Check if Python is installed
- Install missing packages
- Start the service

## Troubleshooting

### If `python` command doesn't work:

Try using the full path:
```bash
C:\Users\user\AppData\Local\Programs\Python\Python313\python.exe -m pip install pymongo python-dotenv
```

### If you have multiple Python installations:

1. Check which Python is being used:
   ```bash
   python --version
   where python
   ```

2. Install packages for that specific Python:
   ```bash
   python -m pip install pymongo python-dotenv
   ```

### Verify Installation:

Run this to test:
```bash
python -c "from pymongo import MongoClient; print('SUCCESS')"
```

If you see "SUCCESS", pymongo is installed correctly.

## Required Packages

- Flask==3.0.0
- flask-cors==4.0.0
- pymongo==4.16.0
- python-dotenv==1.2.1

Install all at once:
```bash
python -m pip install -r requirements.txt
```

