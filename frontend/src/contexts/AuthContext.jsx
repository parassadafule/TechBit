import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';
import socketService from '../lib/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const data = await authAPI.checkAuth();
      const { authenticated, user: currentUser } = data;

      setUser(currentUser);
      setIsAuthenticated(Boolean(authenticated));

      if (authenticated && currentUser?._id) {
        socketService.connect(currentUser._id);
      } else {
        socketService.disconnect();
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      socketService.disconnect();
    } finally {
      setIsLoading(false);
    }
  };

  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    if (userData?._id) {
      socketService.connect(userData._id);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      setIsAuthenticated(false);
      socketService.disconnect();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
