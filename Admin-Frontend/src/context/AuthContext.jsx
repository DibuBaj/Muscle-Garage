import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if admin is already logged in (from localStorage)
  useEffect(() => {
    try {
      const storedAuth = localStorage.getItem('adminAuth');
      const storedToken = localStorage.getItem('adminToken');
      
      if (storedAuth && storedToken) {
        try {
          const { email } = JSON.parse(storedAuth);
          setAdminEmail(email);
          setIsAuthenticated(true);
        } catch (parseError) {
          // If JSON parse fails, clear bad data
          localStorage.removeItem('adminAuth');
          localStorage.removeItem('adminToken');
        }
      }
    } catch (error) {
      // Handle any localStorage access errors (e.g., in private browsing)
      console.error('Failed to access localStorage:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (email, token) => {
    try {
      setAdminEmail(email);
      setIsAuthenticated(true);
      localStorage.setItem('adminAuth', JSON.stringify({ email }));
      localStorage.setItem('adminToken', token);
    } catch (error) {
      console.error('Failed to save auth to localStorage:', error);
      // Still set the state even if localStorage fails
      setAdminEmail(email);
      setIsAuthenticated(true);
    }
  };

  const logout = () => {
    try {
      setAdminEmail(null);
      setIsAuthenticated(false);
      localStorage.removeItem('adminAuth');
      localStorage.removeItem('adminToken');
    } catch (error) {
      console.error('Failed to clear auth from localStorage:', error);
      // Still clear the state
      setAdminEmail(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, adminEmail, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
