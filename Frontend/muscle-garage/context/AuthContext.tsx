import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { API_URL } from '@/constants/api';

interface User {
  id: string;
  username: string;
  email: string;
  fullname: string;
  age?: number;
  weight?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticating: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, fullname: string, password: string, age: number, weight?: number) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadToken();
  }, []);

  const loadToken = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('token');
      const storedUser = await SecureStore.getItemAsync('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error('Error loading token:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setIsAuthenticating(true);
      console.log('Attempting login to:', `${API_URL}/auth/login`);
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      console.log('Login response:', response.data);
      const { token: newToken, user: newUser } = response.data;
      
      await SecureStore.setItemAsync('token', newToken);
      await SecureStore.setItemAsync('user', JSON.stringify(newUser));
      
      setToken(newToken);
      setUser(newUser);
      console.log('Login successful, user set:', newUser);
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Login failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signup = async (
    username: string,
    email: string,
    fullname: string,
    password: string,
    age: number,
    weight?: number
  ) => {
    try {
      setError(null);
      setIsAuthenticating(true);
      console.log('Attempting signup to:', `${API_URL}/auth/signup`);
      
      const response = await axios.post(`${API_URL}/auth/signup`, {
        username,
        email,
        fullname,
        password,
        age,
        weight,
      });

      console.log('Signup response:', response.data);
      const { token: newToken, user: newUser } = response.data;
      
      await SecureStore.setItemAsync('token', newToken);
      await SecureStore.setItemAsync('user', JSON.stringify(newUser));
      
      setToken(newToken);
      setUser(newUser);
      console.log('Signup successful, user set:', newUser);
    } catch (err: any) {
      console.error('Signup error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Signup failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
      setToken(null);
      setUser(null);
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticating, login, signup, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
