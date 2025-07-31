import { mockApi } from './mockData';

// Mock axios instance that mimics the real API
class MockAxiosInstance {
  constructor() {
    this.baseURL = '/api/';
    this.defaults = {
      headers: {
        'Content-Type': 'application/json',
      }
    };
  }

  // Simulate axios get method
  async get(url, config = {}) {
    const path = url.replace(this.baseURL, '');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      let data;
      
      if (path.includes('orders/order-list/')) {
        const params = this.parseQueryString(path.split('?')[1] || '');
        data = await mockApi.getOrders(params);
      } else if (path.includes('orders/waiter-stats/')) {
        const waiterId = path.split('/').pop();
        data = await mockApi.getWaiterStats(waiterId);
      } else if (path.includes('branches/tables/')) {
        data = await mockApi.getTables();
      } else if (path.includes('products/')) {
        data = await mockApi.getProducts();
      } else if (path.includes('users/')) {
        data = await mockApi.getUsers();
      } else if (path.includes('branches/')) {
        data = await mockApi.getBranches();
      } else {
        throw new Error(`Mock API: Endpoint not found - ${path}`);
      }
      
      return { data, status: 200, statusText: 'OK' };
    } catch (error) {
      return Promise.reject({
        response: {
          data: { error: error.message },
          status: 404,
          statusText: 'Not Found'
        }
      });
    }
  }

  // Simulate axios post method
  async post(url, data, config = {}) {
    const path = url.replace(this.baseURL, '');
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      let responseData;
      
      if (path.includes('auth/login/')) {
        responseData = await mockApi.login(data);
      } else if (path.includes('branches/tables/')) {
        responseData = await mockApi.addTable(data);
      } else {
        throw new Error(`Mock API: POST endpoint not found - ${path}`);
      }
      
      return { data: responseData, status: 201, statusText: 'Created' };
    } catch (error) {
      return Promise.reject({
        response: {
          data: { error: error.message },
          status: 400,
          statusText: 'Bad Request'
        }
      });
    }
  }

  // Simulate axios patch method
  async patch(url, data, config = {}) {
    const path = url.replace(this.baseURL, '');
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      let responseData;
      
      if (path.includes('orders/order-item/') && path.includes('/update-status/')) {
        const itemId = path.split('/')[2];
        responseData = await mockApi.updateOrderItemStatus(itemId, data.status);
      } else if (path.includes('users/users/')) {
        const userId = path.split('/')[2];
        responseData = await mockApi.updateUser(userId, data);
      } else {
        throw new Error(`Mock API: PATCH endpoint not found - ${path}`);
      }
      
      return { data: responseData, status: 200, statusText: 'OK' };
    } catch (error) {
      return Promise.reject({
        response: {
          data: { error: error.message },
          status: 400,
          statusText: 'Bad Request'
        }
      });
    }
  }

  // Helper method to parse query string
  parseQueryString(queryString) {
    const params = {};
    if (!queryString) return params;
    
    const pairs = queryString.split('&');
    pairs.forEach(pair => {
      const [key, value] = pair.split('=');
      if (key && value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    });
    
    return params;
  }

  // Add interceptors to mimic axios behavior
  interceptors = {
    request: {
      use: (config) => config,
      eject: () => {}
    },
    response: {
      use: (config) => config,
      eject: () => {}
    }
  };
}

// Create and export the mock instance
const mockAxiosInstance = new MockAxiosInstance();
export default mockAxiosInstance; 