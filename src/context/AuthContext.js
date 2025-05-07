import React, { createContext, useState, useContext, useEffect } from 'react';
import { getAuthStatus, logout as apiLogout } from '../api/api'; // Rename logout import

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const data = await getAuthStatus();
        setUser(data.user);
      } catch (error) {
        setUser(null); // Not logged in
      } finally {
        setIsLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
     try {
         await apiLogout();
         setUser(null);
     } catch (error) {
         console.error("Logout failed:", error);
         // Optionally handle logout error, maybe still clear state
         setUser(null);
     }

  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
