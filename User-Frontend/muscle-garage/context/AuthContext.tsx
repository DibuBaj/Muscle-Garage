import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { storage } from '@/utils/storage';
import { API_URL } from '@/constants/api';

interface User {
  id: string;
  memberId: string;
  username: string;
  email: string;
  phone: string;
  fullname: string;
  dateOfBirth?: string;
  weight?: number;
  createdAt?: string;
  authProvider?: 'email' | 'google';
  googleId?: string;
  profilePicture?: string;
}

interface SignupData {
  username: string;
  email: string;
  fullname: string;
  phone: string;
  password: string;
  dateOfBirth?: string;
  weight?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticating: boolean;
  login: (email: string, password: string) => Promise<void>;
  sendOTP: (data: SignupData) => Promise<string>;
  verifyOTP: (email: string, otp: string) => Promise<void>;
  resendOTP: (email: string) => Promise<void>;
  googleAuth: (googleId: string, email: string, fullname: string, profilePicture?: string) => Promise<boolean>;
  completeGoogleOnboarding: (googleId: string, email: string, fullname: string, username: string, phone: string, dateOfBirth?: string, weight?: number, profilePicture?: string) => Promise<void>;
  updateUserContext: (userData: Partial<User>) => Promise<void>;
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
      const storedToken = await storage.getItem('token');
      const storedUser = await storage.getItem('user');
      
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

      const response = await axios.post(
        `${API_URL}/auth/login`,
        { email, password },
        {
          timeout: 20000,
          validateStatus: () => true,
        }
      );

      if (response.status >= 400) {
        const message = response.data?.message || 'Invalid email or password';
        throw new Error(message);
      }

      console.log('Login response:', response.data);
      const { token: newToken, user: newUser } = response.data;

      await storage.setItem('token', newToken);
      await storage.setItem('user', JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);
      console.log('Login successful, user set:', newUser);
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const sendOTP = async (data: SignupData): Promise<string> => {
    try {
      setError(null);
      setIsAuthenticating(true);
      console.log('Sending OTP to:', `${API_URL}/auth/send-otp`);
      console.log('Request data:', JSON.stringify(data, null, 2));
      
      const response = await axios.post(`${API_URL}/auth/send-otp`, data, {
        timeout: 15000,
        validateStatus: (status) => status < 500, // Accept any status < 500, let frontend handle 4xx
      });

      console.log('OTP response status:', response.status);
      console.log('OTP response data:', response.data);

      if (response.status >= 400) {
        const errorMessage = response.data?.message || 'Failed to send OTP';
        throw new Error(errorMessage);
      }

      if (!response.data.email) {
        throw new Error('Invalid response from server - email not provided');
      }

      console.log('OTP sent successfully to:', response.data.email);
      return response.data.email;
    } catch (err: any) {
      console.error('Send OTP error:', err);
      console.error('Error response data:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Error message:', err.message);
      
      let errorMessage = 'Failed to send OTP.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please check your internet connection.';
      } else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot connect to server. Please check your network.';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const verifyOTP = async (email: string, otp: string) => {
    try {
      setError(null);
      setIsAuthenticating(true);
      console.log('Verifying OTP for:', email);
      
      const response = await axios.post(`${API_URL}/auth/verify-otp`, { email, otp }, {
        timeout: 15000,
        validateStatus: (status) => status < 500,
      });

      console.log('Verify OTP response status:', response.status);
      console.log('Verify OTP response data:', response.data);

      if (response.status >= 400) {
        const errorMessage = response.data?.message || 'Failed to verify OTP';
        throw new Error(errorMessage);
      }
      
      const { token: newToken, user: newUser } = response.data;

      if (!newToken || !newUser) {
        throw new Error('Invalid response from server - token or user not provided');
      }
      
      await storage.setItem('token', newToken);
      await storage.setItem('user', JSON.stringify(newUser));
      
      setToken(newToken);
      setUser(newUser);
      console.log('Account created successfully:', newUser);
    } catch (err: any) {
      console.error('Verify OTP error:', err);
      console.error('Error response:', err.response?.data);
      
      let errorMessage = 'Invalid OTP.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please try again.';
      } else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot connect to server. Please check your network.';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const resendOTP = async (email: string) => {
    try {
      setError(null);
      console.log('Resending OTP to:', email);
      
      const response = await axios.post(`${API_URL}/auth/resend-otp`, { email }, {
        timeout: 15000,
        validateStatus: (status) => status < 500,
      });

      console.log('Resend OTP response status:', response.status);
      console.log('OTP resent successfully');

      if (response.status >= 400) {
        const errorMessage = response.data?.message || 'Failed to resend OTP';
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      console.error('Resend OTP error:', err);
      console.error('Error response:', err.response?.data);
      
      let errorMessage = 'Failed to resend OTP.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please try again.';
      } else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot connect to server. Please check your network.';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const googleAuth = async (googleId: string, email: string, fullname: string, profilePicture?: string): Promise<boolean> => {
    try {
      setError(null);
      setIsAuthenticating(true);
      console.log('Google auth for:', email);
      
      const response = await axios.post(`${API_URL}/auth/google-auth`, {
        googleId,
        email,
        fullname,
        profilePicture,
      });
      
      console.log('Google auth response:', response.data);
      const { isNewUser, token: newToken, user: newUser } = response.data;
      
      if (!isNewUser) {
        // Existing user, store token and user
        await storage.setItem('token', newToken);
        await storage.setItem('user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
      }
      
      return isNewUser;
    } catch (err: any) {
      console.error('Google auth error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Google authentication failed.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const completeGoogleOnboarding = async (googleId: string, email: string, fullname: string, username: string, phone: string, dateOfBirth?: string, weight?: number, profilePicture?: string) => {
    try {
      setError(null);
      setIsAuthenticating(true);
      console.log('Completing Google onboarding for:', email);
      
      const response = await axios.post(`${API_URL}/auth/complete-google-onboarding`, {
        googleId,
        email,
        fullname,
        username,
        phone,
        dateOfBirth,
        weight,
        profilePicture,
      });
      
      console.log('Google onboarding response:', response.data);
      const { token: newToken, user: newUser } = response.data;
      
      await storage.setItem('token', newToken);
      await storage.setItem('user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
    } catch (err: any) {
      console.error('Google onboarding error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to complete onboarding.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = async () => {
    try {
      await storage.deleteItem('token');
      await storage.deleteItem('user');
      setToken(null);
      setUser(null);
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  const updateUserContext = async (userData: Partial<User>) => {
    try {
      if (user) {
        const updatedUser = { ...user, ...userData };
        setUser(updatedUser);
        await storage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error('Error updating user context:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticating, login, sendOTP, verifyOTP, resendOTP, googleAuth, completeGoogleOnboarding, updateUserContext, logout, error }}>
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
