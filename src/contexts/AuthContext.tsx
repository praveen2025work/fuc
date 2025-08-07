import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types/api';
import { apiService } from '@/services/api';

interface AuthContextType {
  user: User | null;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check for stored user data first
        const storedUser = localStorage.getItem('fileUploadUser');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
            setIsLoading(false);
            return;
          } catch (error) {
            console.error('Error parsing stored user data:', error);
            localStorage.removeItem('fileUploadUser');
          }
        }

        // Fetch user data from Windows authentication endpoint
        const userData = await apiService.getCurrentUser();
        setUser(userData);
        localStorage.setItem('fileUploadUser', JSON.stringify(userData));
      } catch (error) {
        console.error('Authentication error:', error);
        setError('Failed to authenticate. Please ensure you are logged into the domain.');
        localStorage.removeItem('fileUploadUser');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const logout = () => {
    setUser(null);
    localStorage.removeItem('fileUploadUser');
    window.location.reload();
  };

  const value = {
    user,
    logout,
    isAuthenticated: !!user,
    isLoading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};