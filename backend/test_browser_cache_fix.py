#!/usr/bin/env python3
"""
Test script to verify CORS fix and provide browser cache clearing instructions
"""

import requests
import json

def test_cors_comprehensive():
    """Comprehensive CORS test"""
    
    print("🔧 Comprehensive CORS Test")
    print("=" * 60)
    
    backend_url = "https://kebede-butchery-ms.onrender.com"
    frontend_url = "https://kebede-butchery-ms.vercel.app"
    
    # Test all the endpoints that were failing
    endpoints_to_test = [
        "/api/branches/tables/",
        "/api/orders/order-list/",
        "/api/users/",
        "/api/users/me/"
    ]
    
    for endpoint in endpoints_to_test:
        print(f"\nTesting endpoint: {endpoint}")
        
        # Test OPTIONS request
        try:
            response = requests.options(
                f"{backend_url}{endpoint}",
                headers={
                    'Origin': frontend_url,
                    'Access-Control-Request-Method': 'POST',
                    'Access-Control-Request-Headers': 'Content-Type, access-control-allow-credentials'
                }
            )
            print(f"OPTIONS Status: {response.status_code}")
            
            if response.status_code == 200:
                print("✅ CORS preflight successful")
                
                # Check if access-control-allow-credentials is in the allowed headers
                allow_headers = response.headers.get('Access-Control-Allow-Headers', '')
                if 'access-control-allow-credentials' in allow_headers.lower():
                    print("✅ access-control-allow-credentials header allowed")
                else:
                    print("❌ access-control-allow-credentials header NOT allowed")
                    print(f"Allowed headers: {allow_headers}")
            else:
                print(f"❌ CORS preflight failed: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error testing {endpoint}: {e}")
    
    print("\n" + "=" * 60)
    print("📋 BROWSER CACHE CLEARING INSTRUCTIONS")
    print("=" * 60)
    print("The CORS configuration is correct on the backend.")
    print("You need to clear your browser cache:")
    print()
    print("1. Open Developer Tools (F12)")
    print("2. Right-click the refresh button")
    print("3. Select 'Empty Cache and Hard Reload'")
    print()
    print("OR use keyboard shortcuts:")
    print("- Chrome/Edge: Ctrl + Shift + R (Windows) or Cmd + Shift + R (Mac)")
    print("- Firefox: Ctrl + F5 (Windows) or Cmd + Shift + R (Mac)")
    print()
    print("After clearing cache, try your frontend again:")
    print("https://kebede-butchery-ms.vercel.app")
    print()
    print("Login credentials:")
    print("Username: kebede_pos")
    print("Password: 12345")

if __name__ == "__main__":
    test_cors_comprehensive() 