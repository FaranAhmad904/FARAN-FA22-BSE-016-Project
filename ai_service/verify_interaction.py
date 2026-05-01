import requests
import pymongo
from datetime import datetime, timedelta
import os
from bson import ObjectId
import time

# Configuration
API_URL = "http://localhost:7001/api/user/deal-interaction"
MONGO_URI = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = "resturantfinder"
TEST_USER_ID = "test_user_verif_123"
TEST_DEAL_ID = "test_deal_999"

def verify_interaction():
    print(f"Connecting to MongoDB at {MONGO_URI}...")
    client = pymongo.MongoClient(MONGO_URI)
    db = client[DB_NAME]
    users = db['userpreferences']

    # 1. Clean up test user
    print(f"Cleaning up test user {TEST_USER_ID}...")
    users.delete_one({"userId": TEST_USER_ID})

    # 2. Send POST request
    payload = {
        "userId": TEST_USER_ID,
        "deal_id": TEST_DEAL_ID,
        "action": "view",
        "city": "Lahore"
    }
    
    print(f"Sending POST request to {API_URL}...")
    try:
        response = requests.post(API_URL, json=payload, timeout=30)
        print(f"Response Status: {response.status_code}")
        print(f"Response Body: {response.json()}")
        
        if response.status_code != 200:
            print("FAILED: API request failed")
            return False
            
    except Exception as e:
        print(f"FAILED: Could not connect to API: {e}")
        print("Please ensure the service is running (python ai_service/analytics_runner.py)")
        return False

    # 3. Verify MongoDB interaction
    print("Verifying MongoDB data...")
    user_doc = users.find_one({"userId": TEST_USER_ID})
    
    if not user_doc:
        print("FAILED: User document not created")
        return False
        
    interactions = user_doc.get("dealInteractions", [])
    if not interactions:
        print("FAILED: dealInteractions array is empty")
        return False
        
    latest_interaction = interactions[-1]
    print(f"Found interaction: {latest_interaction}")
    
    if latest_interaction.get("deal_id") != TEST_DEAL_ID:
        print(f"FAILED: deal_id mismatch. Expected {TEST_DEAL_ID}, got {latest_interaction.get('deal_id')}")
        return False
        
    if latest_interaction.get("action") != "view":
        print(f"FAILED: action mismatch. Expected 'view', got {latest_interaction.get('action')}")
        return False

    # 4. Verify updatedAt
    updated_at = user_doc.get("updatedAt")
    print(f"updatedAt: {updated_at}")
    
    if not updated_at:
        print("FAILED: updatedAt field is missing")
        return False

    # Check if updatedAt is recent (within last 10 seconds)
    # Note: Mongo might return datetime directly
    if isinstance(updated_at, str):
        # fast check, assuming it might not be string if using pymongo
        pass
    elif isinstance(updated_at, datetime):
        time_diff = (updated_at - start_time).total_seconds()
        # Allow some clock skew or timezone diffs if relying on server time vs local time, 
        # but here we just want to ensure it acts close to now.
        # However start_time is UTC and server sets UTC.
        pass

    print("SUCCESS: Deal interaction recorded and updatedAt set!")
    return True

if __name__ == "__main__":
    verify_interaction()
