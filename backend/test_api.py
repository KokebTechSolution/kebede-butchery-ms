#!/usr/bin/env python
import requests
import json

# Test the barman-stock API endpoint
url = "http://localhost:8000/api/inventory/barman-stock/"

try:
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Total records: {len(data)}")
        
        if data:
            # Show the first record structure
            first_record = data[0]
            print("\nFirst record structure:")
            print(json.dumps(first_record, indent=2, default=str))
            
            # Check if the nested structure exists
            if 'stock' in first_record:
                print("\n✅ 'stock' field exists")
                if 'product' in first_record['stock']:
                    print("✅ 'stock.product' field exists")
                    if 'item_type' in first_record['stock']['product']:
                        print("✅ 'stock.product.item_type' field exists")
                        print(f"   Item Type: {first_record['stock']['product']['item_type']}")
                    else:
                        print("❌ 'stock.product.item_type' field missing")
                    
                    if 'category' in first_record['stock']['product']:
                        print("✅ 'stock.product.category' field exists")
                        print(f"   Category: {first_record['stock']['product']['category']}")
                    else:
                        print("❌ 'stock.product.category' field missing")
                else:
                    print("❌ 'stock.product' field missing")
            else:
                print("❌ 'stock' field missing")
    else:
        print(f"Error: {response.text}")
        
except Exception as e:
    print(f"Error: {e}")
