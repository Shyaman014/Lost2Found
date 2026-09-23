import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authService.getCurrentUser();
        if (response.success) {
          setCurrentUser(response.data.user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        setCurrentUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    if (response.success) {
      setCurrentUser(response.data.user);
      setIsAuthenticated(true);
    }
    return response;
  };

  const register = async (userData) => {
    const response = await authService.register(userData);
    if (response.success) {
      setCurrentUser(response.data.user);
      setIsAuthenticated(true);
    }
    return response;
  };

  const logout = async () => {
    await authService.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
