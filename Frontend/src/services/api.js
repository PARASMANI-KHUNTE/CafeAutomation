import axios from 'axios';
import config from '../config';

const API_URL = config.API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    const sessionToken = localStorage.getItem('sessionToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (sessionToken) {
      config.headers['x-session-token'] = sessionToken;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  getAllUsers: async () => {
    const response = await api.get('/auth/users');
    return response.data;
  },
  
  updateUser: async (id, userData) => {
    const response = await api.put(`/auth/${id}`, userData);
    return response.data;
  },
  
  deleteUser: async (id) => {
    const response = await api.delete(`/auth/${id}`);
    return response.data;
  },
  
  // Password reset endpoints
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
  
  verifyOtp: async (email, otp) => {
    const response = await api.post('/auth/verify-otp', { email, otp });
    return response.data;
  },
  
  resetPassword: async (email, otp, newPassword) => {
    const response = await api.post('/auth/reset-password', { email, otp, newPassword });
    return response.data;
  }
};

export const menuAPI = {
  getAllMenu: async () => {
    const response = await api.get('/menu');
    return response.data;
  },

  getMenu: async (id) => {
    const response = await api.get(`/menu/${id}`);
    return response.data;
  },

  createMenu: async (formData) => {
    const response = await api.post('/menu', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateMenu: async (id, formData) => {
    const response = await api.put(`/menu/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteMenu: async (id) => {
    const response = await api.delete(`/menu/${id}`);
    return response.data;
  }
};

export const orderAPI = {
  createOrder: async (orderData) => {
    // Ensure tableId is included in the order data
    if (!orderData.tableId) {
      throw new Error('Table ID is required');
    }
    
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  getOrders: async () => {
    const response = await api.get('/orders');
    return response.data;
  },

  getOrder: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  updateOrderStatus: async (id, status) => {
    const response = await api.put(`/orders/${id}`, { status });
    return response.data;
  },

  addMoreItems: async (data) => {
    // Extract orderId and other data
    const { orderId, items, customerName, customerPhone } = data;
    
    // Add the session token for customer orders
    const sessionToken = localStorage.getItem('sessionToken');
    const payload = { 
      items, 
      sessionToken,
      customerName,
      customerPhone 
    };
    
    // Use the correct endpoint path as defined in the router (/orders/:id/items)
    const response = await api.post(`/orders/${orderId}/items`, payload);
    return response.data;
  },

  getCustomerOrders: async () => {
    try {
      // Get session token from localStorage
      const sessionToken = localStorage.getItem('sessionToken');
      
      if (!sessionToken) {
        console.error('No session token found for customer orders');
        return [];
      }
      
      // Make sure the session token is included in the request headers
      const response = await api.get('/orders/customer', {
        headers: {
          'x-session-token': sessionToken
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      throw error;
    }
  }
};

export default api; 