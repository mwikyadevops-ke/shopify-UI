import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [currentShop, setCurrentShop] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = authService.getCurrentUser();
    const storedShop = authService.getCurrentShop();
    if (storedUser) {
      setUser(storedUser);
    }
    if (storedShop) {
      setCurrentShop(storedShop);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      if (response.success) {
        // Backend returns accessToken and sets refreshToken as cookie
        const token = response.data?.accessToken || response.data?.token;
        const user = response.data?.user || response.data;
        
        if (token && user) {
          authService.setAuth(token, user);
          setUser(user);
          
          // Set current shop after login
          const shop = authService.getCurrentShop();
          if (shop) {
            setCurrentShop(shop);
          }
          return { success: true };
        } else {
          return {
            success: false,
            message: 'Invalid response from server. Please try again.'
          };
        }
      }
      return { 
        success: false, 
        message: response.message || 'Login failed. Please check your credentials and try again.' 
      };
    } catch (error) {
      // Handle different error types with specific messages
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401) {
          errorMessage = data?.message || 'Invalid email or password. Please check your credentials.';
        } else if (status === 403) {
          errorMessage = data?.message || 'Access denied. Your account may be inactive.';
        } else if (status === 404) {
          errorMessage = data?.message || 'User not found. Please check your email address.';
        } else if (status === 422) {
          errorMessage = data?.message || 'Invalid input. Please check your email and password format.';
        } else if (status === 429) {
          errorMessage = 'Too many login attempts. Please try again later.';
        } else if (status >= 500) {
          errorMessage = 'Server error. Please try again later or contact support.';
        } else {
          errorMessage = data?.message || `Login failed (Error ${status}). Please try again.`;
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else {
        // Something else happened
        errorMessage = error.message || 'An unexpected error occurred. Please try again.';
      }
      
      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  const switchShop = (shop) => {
    authService.setCurrentShop(shop);
    setCurrentShop(shop);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setCurrentShop(null);
  };

  // Get available shops for the user
  const getAvailableShops = () => {
    if (!user) return [];
    
    // If user has shops array (multi-shop user)
    if (user.shops && Array.isArray(user.shops)) {
      return user.shops;
    }
    
    // If user has single shop_id, return array with that shop
    if (user.shop_id) {
      return [{ id: user.shop_id, name: user.shop_name || 'Shop' }];
    }
    
    return [];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentShop,
        login,
        logout,
        switchShop,
        getAvailableShops,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


