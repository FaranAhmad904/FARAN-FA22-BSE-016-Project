
import urllib.request
import json
import urllib.error

# Configuration
url = "http://localhost:5000/api/recommend"
user_preferences = {
    "preferences": {
        "cuisine": ["Fast Food", "Pakistani"],
        "spiceLevel": 3,
        "budget": "low",
        "dietary": "halal",
        "city": "Multan"
    },
    "userId": "demo_user"
}

print(f"Checking Python AI Service at {url}...")

try:
    # 1. Send Request
    json_data = json.dumps(user_preferences).encode('utf-8')
    req = urllib.request.Request(url, data=json_data, headers={'Content-Type': 'application/json'})

    print("\n--- Sending User Preferences ---")
    print(json.dumps(user_preferences['preferences'], indent=2))

    with urllib.request.urlopen(req) as response:
        # 2. Fetch Response
        if response.getcode() == 200:
            body = response.read().decode('utf-8')
            data = json.loads(body)
            
            # 3. Display Recommendations
            recommendations = data.get('recommendations', [])
            print(f"\n--- AI Service Response (Status: {response.getcode()}) ---")
            print(f"Found {len(recommendations)} recommendations:\n")
            
            for i, rec in enumerate(recommendations):
                restaurant = rec.get('restaurant', {})
                print(f"#{i+1}: {restaurant.get('name')} (Match: {rec.get('match_percentage')}%)")
                print(f"    Explanation: {rec.get('explanation')}")
                
                deals = restaurant.get('deals', [])
                if deals:
                    print(f"    Matching Deals ({len(deals)}):")
                    for deal in deals:
                        print(f"      - {deal.get('title')} | Rs. {deal.get('price')} | Spice: {deal.get('spiceLevel', 'N/A')}")
                else:
                    print("    No deals match your budget/criteria.")
                print("-" * 50)
                
        else:
            print(f"Error: Service returned status {response.getcode()}")

except urllib.error.URLError:
    print("\n[ERROR] Python AI Recommendation Service is not running. Please start aiservice/app.py.")
except Exception as e:
    print(f"\n[ERROR] An unexpected error occurred: {e}")
