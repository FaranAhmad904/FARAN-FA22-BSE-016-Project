
import os
from pymongo import MongoClient
from dotenv import load_dotenv
import json

load_dotenv()

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('MONGO_DB_NAME', 'resturantfinder')

print(f"Connecting to {MONGO_URL}, DB: {DB_NAME}")

try:
    mongo_client = MongoClient(MONGO_URL)
    db = mongo_client[DB_NAME]
    restaurants_collection = db['restaurants']
    
    # Find Jaffaz
    jaffaz = restaurants_collection.find_one({"name": {"$regex": "Jaffaz", "$options": "i"}})
    
    if jaffaz:
        print(f"Found Restaurant: {jaffaz.get('name')}")
        deals = jaffaz.get('deals', [])
        print(f"Number of deals: {len(deals)}")
        for i, deal in enumerate(deals):
            print(f"Deal {i+1}: {deal.get('title')} - Price: {deal.get('price')}")
            # Print AI fields if present
            ai_fields = {}
            if 'spiceLevel' in deal: ai_fields['spiceLevel'] = deal['spiceLevel']
            if 'dietary' in deal: ai_fields['dietary'] = deal['dietary']
            if 'cuisine' in deal: ai_fields['cuisine'] = deal['cuisine']
            if ai_fields:
                print(f"  AI Data: {ai_fields}")
    else:
        print("Restaurant 'Jaffaz' not found")
        
except Exception as e:
    print(f"[ERROR] {e}")
