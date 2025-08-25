"""
Custom JWT views using PyJWT instead of rest_framework_simplejwt
"""
import jwt
from datetime import datetime, timedelta
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
import json

# Get secret key from settings, fallback to a default
SECRET_KEY = getattr(settings, 'SECRET_KEY', 'your-secret-key-here')

@method_decorator(csrf_exempt, name='dispatch')
class CustomTokenObtainPairView(View):
    """Custom JWT token obtain view"""
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
            
            if not username or not password:
                return JsonResponse({
                    'error': 'Username and password are required'
                }, status=400)
            
            # Authenticate user
            user = authenticate(username=username, password=password)
            
            if user is None:
                return JsonResponse({
                    'error': 'Invalid credentials'
                }, status=401)
            
            # Generate tokens
            access_token = self.generate_access_token(user)
            refresh_token = self.generate_refresh_token(user)
            
            return JsonResponse({
                'access': access_token,
                'refresh': refresh_token,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'role': getattr(user, 'role', 'user')
                }
            })
            
        except json.JSONDecodeError:
            return JsonResponse({
                'error': 'Invalid JSON'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'error': str(e)
            }, status=500)
    
    def generate_access_token(self, user):
        """Generate access token"""
        payload = {
            'user_id': user.id,
            'username': user.username,
            'exp': datetime.utcnow() + timedelta(minutes=60),  # 1 hour
            'iat': datetime.utcnow(),
            'type': 'access'
        }
        return jwt.encode(payload, SECRET_KEY, algorithm='HS256')
    
    def generate_refresh_token(self, user):
        """Generate refresh token"""
        payload = {
            'user_id': user.id,
            'username': user.username,
            'exp': datetime.utcnow() + timedelta(days=7),  # 7 days
            'iat': datetime.utcnow(),
            'type': 'refresh'
        }
        return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

@method_decorator(csrf_exempt, name='dispatch')
class CustomTokenRefreshView(View):
    """Custom JWT token refresh view"""
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            refresh_token = data.get('refresh')
            
            if not refresh_token:
                return JsonResponse({
                    'error': 'Refresh token is required'
                }, status=400)
            
            # Decode and verify refresh token
            try:
                payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=['HS256'])
                
                if payload.get('type') != 'refresh':
                    return JsonResponse({
                        'error': 'Invalid token type'
                    }, status=401)
                
                # Check if token is expired
                if datetime.utcnow().timestamp() > payload.get('exp'):
                    return JsonResponse({
                        'error': 'Token expired'
                    }, status=401)
                
                # Get user
                user_id = payload.get('user_id')
                user = User.objects.get(id=user_id)
                
                # Generate new access token
                access_token = self.generate_access_token(user)
                
                return JsonResponse({
                    'access': access_token
                })
                
            except jwt.InvalidTokenError:
                return JsonResponse({
                    'error': 'Invalid token'
                }, status=401)
                
        except json.JSONDecodeError:
            return JsonResponse({
                'error': 'Invalid JSON'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'error': str(e)
            }, status=500)
    
    def generate_access_token(self, user):
        """Generate access token"""
        payload = {
            'user_id': user.id,
            'username': user.username,
            'exp': datetime.utcnow() + timedelta(minutes=60),  # 1 hour
            'iat': datetime.utcnow(),
            'type': 'access'
        }
        return jwt.encode(payload, SECRET_KEY, algorithm='HS256')
