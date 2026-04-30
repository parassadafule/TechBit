import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';
import { authTokenKey } from '../lib/axios';
import socketService from '../lib/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const tokenFromUrl = getTokenFromUrl();
    if (tokenFromUrl) {
      window.localStorage.setItem(authTokenKey, tokenFromUrl);
      clearTokenFromUrl();
    }
    checkAuth();
  }, []);

  const getTokenFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('token');
  };

  const clearTokenFromUrl = () => {
    const { pathname, search } = window.location;
    const params = new URLSearchParams(search);
    params.delete('token');
    const nextSearch = params.toString();
    const nextUrl = nextSearch ? `${pathname}?${nextSearch}` : pathname;
    window.history.replaceState({}, document.title, nextUrl);
  };

  const checkAuth = async () => {
    const token = window.localStorage.getItem(authTokenKey);
    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      socketService.disconnect();
      setIsLoading(false);
      return;
    }

    try {
      const data = await authAPI.checkAuth();
      const { user: currentUser } = data;

      setUser(currentUser);
      setIsAuthenticated(Boolean(currentUser));

      if (currentUser?._id) {
        socketService.connect(currentUser._id);
      } else {
        socketService.disconnect();
      }
    } catch (error) {
      window.localStorage.removeItem(authTokenKey);
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
      window.localStorage.removeItem(authTokenKey);
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
