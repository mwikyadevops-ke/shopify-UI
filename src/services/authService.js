import api from './api';

// Helper function to get cookie value
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

// Helper function to set cookie (if needed)
const setCookie = (name, value, days = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

export const authService = {
  login: async (email, password) => {
    // Ensure email and password are trimmed and not empty
    const trimmedEmail = (email || '').trim();
    const trimmedPassword = (password || '').trim();
    
    console.log('🔐 Login attempt:', { 
      email: trimmedEmail, 
      passwordLength: trimmedPassword.length,
      passwordPreview: trimmedPassword.substring(0, 2) + '***'
    });
    
    if (!trimmedEmail || !trimmedPassword) {
      console.warn('⚠️ Login validation failed: Email or password is empty');
      return {
        success: false,
        message: 'Email and password are required.'
      };
    }
    
    try {
      const response = await api.post('/users/login', { 
        email: trimmedEmail, 
        password: trimmedPassword 
      });
      console.log('✅ Login response:', response.data);
      // Backend returns accessToken and sets refreshToken as cookie
      // The refreshToken is automatically handled via cookies
      return response.data;
    } catch (error) {
      console.error('❌ Login error:', error);
      // Re-throw so AuthContext can handle it
      throw error;
    }
  },

  refreshToken: async (refreshToken) => {
    try {
      console.log('🔄 Refreshing token...');
      const response = await api.post('/users/refresh-token', {
        refreshToken: refreshToken
      });
      console.log('✅ Token refresh successful');
      return response.data;
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      throw error;
    }
  },

  getRefreshToken: () => {
    // Try to get refreshToken from cookie
    const refreshToken = getCookie('refreshToken');
    return refreshToken;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/users/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token, password, passwordConfirmation) => {
    const response = await api.post('/users/reset-password', {
      token,
      password,
      password_confirmation: passwordConfirmation,
    });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('currentShop');
  },

  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem('user') || 'null');
  },

  getCurrentShop: () => {
    return JSON.parse(localStorage.getItem('currentShop') || 'null');
  },

  setAuth: (token, user) => {
    // Store accessToken (the response may have 'accessToken' or 'token')
    const accessToken = token || user?.accessToken;
    if (accessToken) {
      localStorage.setItem('token', accessToken);
    }
    localStorage.setItem('user', JSON.stringify(user));
    // Set default shop if user has shops
    if (user.shops && user.shops.length > 0) {
      const defaultShop = user.shops.find(s => s.id === user.shop_id) || user.shops[0];
      localStorage.setItem('currentShop', JSON.stringify(defaultShop));
    } else if (user.shop_id) {
      // If user has single shop_id, store it
      localStorage.setItem('currentShop', JSON.stringify({ id: user.shop_id }));
    }
  },

  setCurrentShop: (shop) => {
    localStorage.setItem('currentShop', JSON.stringify(shop));
  },
};


