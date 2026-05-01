
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('MONGO_DB_NAME', 'resturantfinder')

print(f"Connecting to {MONGO_URL}, DB: {DB_NAME}")

try:
    mongo_client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=2000)
    db = mongo_client[DB_NAME]
    
    # Test connection
    mongo_client.admin.command('ping')
    print("[OK] MongoDB connection verified")
    
    restaurants_collection = db['restaurants']
    count = restaurants_collection.count_documents({})
    print(f"Found {count} restaurants")
    
except Exception as e:
    print(f"[ERROR] MongoDB connection error: {e}")
