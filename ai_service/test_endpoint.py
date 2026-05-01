
import urllib.request
import json
import urllib.error

url = "http://localhost:5000/api/recommend"
data = {
    "preferences": {
        "cuisine": ["Pakistani", "BBQ"],
        "spiceLevel": 4,
        "budget": "medium",
        "dietary": "halal",
        "city": "Multan"
    },
    "userId": "test_user"
}

json_data = json.dumps(data).encode('utf-8')
req = urllib.request.Request(url, data=json_data, headers={'Content-Type': 'application/json'})

try:
    print(f"Sending request to {url}...")
    with urllib.request.urlopen(req) as response:
        print(f"Status Code: {response.getcode()}")
        body = response.read().decode('utf-8')
        try:
            print(json.dumps(json.loads(body), indent=2))
        except:
            print(body)
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(e.read().decode('utf-8'))
except Exception as e:
    print(f"Error: {e}")
