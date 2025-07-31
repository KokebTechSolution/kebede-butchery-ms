#!/usr/bin/env python3
"""
Test script to check the HTML version of the root endpoint
"""

import requests

def test_html_endpoint():
    """Test the HTML version of the root endpoint"""
    
    print("Testing HTML version of root endpoint...")
    print("=" * 50)
    
    try:
        response = requests.get("https://kebede-butchery-ms.onrender.com/", 
                              headers={'Accept': 'text/html'})
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ HTML endpoint working!")
            content = response.text
            if "Kebede Butchery Management System" in content:
                print("✅ HTML template is being served correctly!")
            else:
                print("⚠️  HTML template might not be working as expected")
            
            # Show first few lines
            lines = content.split('\n')[:10]
            print("\nFirst 10 lines of response:")
            for i, line in enumerate(lines, 1):
                print(f"{i:2d}: {line}")
        else:
            print(f"❌ HTML endpoint failed: {response.text}")
    except Exception as e:
        print(f"❌ Error testing HTML endpoint: {e}")

if __name__ == "__main__":
    test_html_endpoint() 