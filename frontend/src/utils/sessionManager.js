import axiosInstance from '../api/axiosInstance';

export const initializeSession = async () => {
  try {
    console.log('Initializing session.');
    
    // Step 1: Get CSRF token
    console.log('Step 1: Getting CSRF token...');
    try {
      // Get the API base URL dynamically
      const { API_BASE_URL } = await import('../api/config');
      
      // Make a direct request to get fresh CSRF token
      const csrfResponse = await fetch(`${API_BASE_URL}/api/users/csrf/`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!csrfResponse.ok) {
        throw new Error(`CSRF request failed: ${csrfResponse.status}`);
      }
      
      console.log('CSRF token refreshed successfully');
      
      // Wait a moment for the cookie to be set
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (csrfError) {
      console.error('CSRF token refresh failed:', csrfError);
      throw new Error('Failed to refresh CSRF token');
    }

    // Step 2: Session is ready for login (no need to check /me yet)
    console.log('Step 2: Session ready for login');
    
    return {
      success: true,
      user: null, // No user data yet, but session is ready
      message: 'Session initialized successfully - ready for login'
    };
  } catch (error) {
    console.error('Session initialization failed:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return {
      success: false,
      error: error.message || 'Session initialization failed',
      message: 'Failed to initialize session'
    };
  }
};

export const refreshSession = async () => {
  try {
    // Refresh user data using unified endpoint
    const userResponse = await axiosInstance.get('users/me/');
    return {
      success: true,
      user: userResponse.data
    };
  } catch (error) {
    console.error('Session refresh failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const validateSession = async () => {
  try {
    // Use unified endpoint for session validation
    const response = await axiosInstance.get('users/me/');
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

export const clearSession = () => {
  // Clear any stored session data
  localStorage.removeItem('user');
  sessionStorage.clear();
  
  // Clear cookies if needed
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  });
}; 