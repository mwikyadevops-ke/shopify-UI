import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies in requests
});

// Helper function to get cookie value
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

// Flag to prevent infinite refresh loops
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Log outgoing requests for debugging
    console.log('📤 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      data: config.data,
      headers: { ...config.headers, Authorization: config.headers.Authorization ? 'Bearer ***' : undefined }
    });
    return config;
  },
  (error) => {
    console.error('❌ Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    console.log('✅ API Success:', response.config.method?.toUpperCase(), response.config.url, response.status);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log errors for debugging
    if (error.response) {
      console.error('❌ API Error:', {
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        fullError: error.response
      });
    } else if (error.request) {
      console.error('❌ API Request Error (No Response):', {
        url: error.config?.url,
        message: 'Network error - no response received'
      });
    } else {
      console.error('❌ API Error:', error.message);
    }

    // Handle 401 errors - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      const isLoginRequest = originalRequest.url?.includes('/users/login');
      const isRefreshRequest = originalRequest.url?.includes('/users/refresh-token');
      const isLoginPage = window.location.pathname === '/login';

      // Don't attempt refresh for login or refresh token requests
      if (isLoginRequest || isRefreshRequest) {
        if (!isLoginRequest && !isLoginPage) {
          // Clear storage and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
        }
        return Promise.reject(error);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      // Get refreshToken from cookie
      const refreshToken = getCookie('refreshToken');

      if (!refreshToken) {
        // No refresh token available, redirect to login
        console.warn('⚠️ No refresh token found, redirecting to login');
        isRefreshing = false;
        processQueue(error, null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        if (!isLoginPage) {
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
        }
        return Promise.reject(error);
      }

      try {
        // Attempt to refresh token
        const response = await axios.post(
          `${API_BASE_URL}/users/refresh-token`,
          { refreshToken },
          { withCredentials: true }
        );

        const { accessToken, token } = response.data?.data || response.data || {};
        const newToken = accessToken || token;

        if (newToken) {
          // Update stored token
          localStorage.setItem('token', newToken);
          
          // Update Authorization header for the original request
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          // Process queued requests
          processQueue(null, newToken);
          isRefreshing = false;
          
          // Retry the original request
          return api(originalRequest);
        } else {
          throw new Error('No token received from refresh');
        }
      } catch (refreshError) {
        // Refresh failed, clear storage and redirect
        console.error('❌ Token refresh failed:', refreshError);
        isRefreshing = false;
        processQueue(refreshError, null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        if (!isLoginPage) {
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle other 401 errors (after refresh attempt failed)
    if (error.response?.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/users/login');
      const isLoginPage = window.location.pathname === '/login';
      
      // Don't redirect if we're already on login page or making a login request
      if (!isLoginRequest && !isLoginPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Use setTimeout to allow network tab to record the request first
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      } else {
        // Just clear storage, don't redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;


