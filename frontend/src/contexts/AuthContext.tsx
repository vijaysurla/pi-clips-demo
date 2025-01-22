import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { User } from '../types/user';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authenticate: () => Promise<void>;
  signOut: () => void;
  updateUser: (updatedUser: User) => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users/me', {
        withCredentials: true
      });
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const authenticate = async () => {
    if (typeof window.Pi === 'undefined') {
      throw new Error('Pi Network SDK not found');
    }

    try {
      const authResult = await window.Pi.authenticate(['username', 'payments'], onIncompletePaymentFound);
    
      if (authResult) {
        console.log('Attempting to authenticate with:', {
          uid: authResult.user.uid,
          username: authResult.user.username
        });
        const response = await axios.post(
          '/api/users/authenticate',
          {
            uid: authResult.user.uid,
            username: authResult.user.username,
            accessToken: authResult.accessToken
          },
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        setUser(response.data.user);
        setToken(response.data.token);
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  };

  const signOut = () => {
    setUser(null);
    setToken(null);
    // You might want to call a logout endpoint here
  };

  const onIncompletePaymentFound = (payment: any) => {
    console.log('Incomplete payment found:', payment);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    authenticate,
    signOut,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

















