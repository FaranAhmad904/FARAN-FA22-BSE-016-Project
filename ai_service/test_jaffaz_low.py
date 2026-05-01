
import urllib.request
import json
import urllib.error

url = "http://localhost:5000/api/recommend"
data = {
    "preferences": {
        "cuisine": ["Fast Food"],
        "spiceLevel": 3,
        "budget": "low",
        "dietary": "halal",
        "city": "Multan"
    },
    "userId": "test_user_low"
}

json_data = json.dumps(data).encode('utf-8')
req = urllib.request.Request(url, data=json_data, headers={'Content-Type': 'application/json'})

try:
    print(f"Sending request to {url}...")
    with urllib.request.urlopen(req) as response:
        print(f"Status Code: {response.getcode()}")
        body = response.read().decode('utf-8')
        data = json.loads(body)
        
        recommendations = data.get('recommendations', [])
        print(f"Total Recommendations: {len(recommendations)}")
        
        for rec in recommendations:
            restaurant = rec.get('restaurant', {})
            name = restaurant.get('name')
            if "Jaffaz" in name:
                print(f"--- {name} ---")
                deals = restaurant.get('deals', [])
                print(f"Total Deals: {len(deals)}")
                for deal in deals:
                    print(f"- {deal.get('title')} (${deal.get('price')})")
                
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(e.read().decode('utf-8'))
except Exception as e:
    print(f"Error: {e}")
