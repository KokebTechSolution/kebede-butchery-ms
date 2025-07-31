import axiosInstance from '../api/axiosInstance';

export const initializeSession = async () => {
  try {
    console.log('Initializing session...');

    // Step 1: Verify CSRF token
    console.log('Step 1: Verifying CSRF token...');
    try {
      const csrfResponse = await axiosInstance.get('users/csrf/');
      console.log('CSRF response:', csrfResponse.status);
    } catch (csrfError) {
      console.log('CSRF verification failed, but continuing:', csrfError);
    }

    // Step 2: Get user data
    console.log('Step 2: Getting user data...');
    const userResponse = await axiosInstance.get('users/me/');
    console.log('User response:', userResponse.data);

    // Step 3: Load any additional data needed for the app
    // You can add more API calls here as needed
    // For example: orders, inventory, etc.

    return {
      success: true,
      user: userResponse.data,
      message: 'Session initialized successfully'
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
    // Refresh user data
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