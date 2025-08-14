# Session Persistence Fix for Network Mode

## Problem Description
When running the application in network mode and refreshing the page, users were being logged out unexpectedly. This was caused by session management issues between the frontend and backend across different network configurations.

## Root Causes Identified

### 1. Session Cookie Configuration
- **Issue**: Session cookies were set with `SameSite=Lax` which prevented proper cross-origin cookie handling
- **Impact**: Cookies weren't being sent properly from different network devices
- **Fix**: Changed to `SameSite=None` for better cross-origin compatibility

### 2. CORS Configuration
- **Issue**: CORS headers weren't properly configured for credential-based requests
- **Impact**: Session cookies weren't being accepted by the browser
- **Fix**: Updated CORS middleware to properly handle credentials and origin-specific responses

### 3. Session Validation Logic
- **Issue**: Session validation was too strict and didn't handle edge cases
- **Impact**: Valid sessions were being rejected on page refresh
- **Fix**: Enhanced session validation with fallback mechanisms and session restoration

### 4. Frontend Session Handling
- **Issue**: Frontend was clearing user state on any API error
- **Impact**: Network errors caused immediate logout
- **Fix**: Only clear user state on actual authentication failures (401 errors)

## Changes Made

### Backend Changes

#### 1. Settings (`backend/kebede_pos/settings.py`)
```python
# Session settings updated
SESSION_COOKIE_SAMESITE = 'None'  # Changed from 'Lax'
SESSION_COOKIE_ACCESSIBLE = True
SESSION_COOKIE_USE_HTTPS = False
```

#### 2. CORS Middleware (`backend/core/middleware.py`)
```python
# Enhanced CORS handling
response['Access-Control-Allow-Origin'] = origin  # Dynamic origin
response['Access-Control-Expose-Headers'] = 'Content-Type, Authorization, X-CSRFToken, Set-Cookie'
```

#### 3. Session Manager (`backend/core/session_manager.py`)
```python
# Enhanced session validation
if not session_key:
    # Try to get session key from cookies if not in request
    sessionid_cookie = request.COOKIES.get('sessionid')
    if sessionid_cookie:
        request.session.session_key = sessionid_cookie
        session_key = sessionid_cookie

# Refresh session expiry on validation
session.set_expiry(timezone.now() + timedelta(hours=24))
session.save()
```

#### 4. CurrentUserView (`backend/users/views.py`)
```python
# Session restoration logic
if sessionid_cookie and not request.session.session_key:
    try:
        # Restore the session from cookie
        session = Session.objects.get(session_key=sessionid_cookie)
        request.session.session_key = sessionid_cookie
        # ... session restoration logic
    except (Session.DoesNotExist, User.DoesNotExist):
        pass
```

### Frontend Changes

#### 1. AuthContext (`frontend/src/context/AuthContext.jsx`)
```javascript
// Better error handling
if (error.response && error.response.status === 401) {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('session_key');
}
// For other errors, keep existing user state

// Enhanced session restoration
useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedSessionKey = localStorage.getItem('session_key');
    
    if (storedUser && storedSessionKey) {
        // Restore user immediately, then validate with backend
        setUser(JSON.parse(storedUser));
        fetchSessionUser().catch(error => {
            // Don't clear user immediately on network errors
        });
    }
}, []);
```

#### 2. Start Script (`start-network.sh`)
```bash
# Environment variables for better session handling
export DJANGO_SETTINGS_MODULE=kebede_pos.settings
export DJANGO_DEBUG=True
export DJANGO_ALLOWED_HOSTS="192.168.1.8,192.168.100.122,localhost,127.0.0.1"
export REACT_APP_ENABLE_SESSION_PERSISTENCE=true
```

## Testing the Fix

### 1. Run the Updated Network Script
```bash
./start-network.sh
```

### 2. Test Session Persistence
```bash
python3 test-session-persistence.py
```

### 3. Manual Testing Steps
1. Start the network environment
2. Login from any device on the network
3. Refresh the page multiple times
4. Verify user remains logged in
5. Test from different devices (phone, tablet, other computers)

## Expected Behavior After Fix

✅ **Page refresh maintains login state**
✅ **Sessions persist across network requests**
✅ **Cross-origin cookie handling works properly**
✅ **Better error handling prevents false logouts**
✅ **Session restoration from cookies works**

## Troubleshooting

### If issues persist:

1. **Check browser console** for CORS or cookie errors
2. **Verify network connectivity** between devices
3. **Check Django logs** for session-related errors
4. **Clear browser cookies** and test again
5. **Verify IP addresses** in start-network.sh match your network

### Common Issues:

- **CORS errors**: Ensure backend is running and accessible
- **Cookie not set**: Check SameSite and Secure settings
- **Session expired**: Verify SESSION_COOKIE_AGE setting
- **Network timeout**: Check firewall and network configuration

## Security Considerations

- `SameSite=None` allows cross-origin cookies (necessary for network access)
- `Secure=False` allows HTTP (development only, change to True in production)
- Session expiry is set to 24 hours for convenience
- CSRF protection remains active for all non-GET requests

## Production Deployment

For production, consider:
- Setting `SESSION_COOKIE_SECURE = True` (HTTPS only)
- Reducing `SESSION_COOKIE_AGE` for security
- Implementing session rotation
- Adding rate limiting for authentication endpoints
