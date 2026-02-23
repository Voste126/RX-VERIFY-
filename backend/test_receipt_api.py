import urllib.request
import json

BASE_URL = 'http://127.0.0.1:8000/api'

# 1. Login as Pharmacist
login_data = json.dumps({
    'username': 'honey', 
    'password': 'rxverifypassword' 
}).encode('utf-8')

req = urllib.request.Request(f"{BASE_URL}/auth/token/", data=login_data, headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req) as response:
        res = json.loads(response.read().decode('utf-8'))
        token = res.get('access')
except Exception as e:
    exit(1)

# 2. Get a manifest ID
req_m = urllib.request.Request(f"{BASE_URL}/manifests/", headers={'Authorization': f'Bearer {token}'})
try:
    with urllib.request.urlopen(req_m) as response:
        mani = json.loads(response.read().decode('utf-8'))
        manifest_id = mani['results'][0]['id'] if 'results' in mani and len(mani['results']) > 0 else "00000000-0000-0000-0000-000000000000"
except Exception as e:
    manifest_id = "00000000-0000-0000-0000-000000000000"


# 3. Test POST /api/receipts/
data = json.dumps({
    "lot": manifest_id,
    "location_coord": {"lat": -1.2, "lng": 36.8}
}).encode('utf-8')

req_post = urllib.request.Request(f"{BASE_URL}/receipts/", data=data, headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'})
try:
    with urllib.request.urlopen(req_post) as response:
except urllib.error.HTTPError as e:
except Exception as e:
