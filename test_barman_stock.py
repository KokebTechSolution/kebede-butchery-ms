import requests
import json

# Test the barman stock API with session authentication
def test_barman_stock_api():
    # Create a session to maintain cookies
    session = requests.Session()
    
    try:
        # First, try to get the barman stock endpoint
        response = session.get('http://localhost:8000/api/inventory/barman-stock/', 
                              headers={'Content-Type': 'application/json'})
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Number of barman stock records: {len(data)}")
            if data:
                print(f"First record: {json.dumps(data[0], indent=2)}")
        elif response.status_code == 401:
            print("Authentication required. This is expected for protected endpoints.")
            print("The frontend should handle authentication automatically.")
        else:
            print(f"Error: {response.status_code}")
            
    except Exception as e:
        print(f"Error testing API: {e}")

if __name__ == "__main__":
    test_barman_stock_api() 