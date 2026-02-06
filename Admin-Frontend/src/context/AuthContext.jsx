import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if admin is already logged in (from localStorage)
  useEffect(() => {
    const storedAuth = localStorage.getItem('adminAuth');
    const storedToken = localStorage.getItem('adminToken');
    if (storedAuth && storedToken) {
      const { email } = JSON.parse(storedAuth);
      setAdminEmail(email);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = (email, token) => {
    setAdminEmail(email);
    setIsAuthenticated(true);
    localStorage.setItem('adminAuth', JSON.stringify({ email }));
    localStorage.setItem('adminToken', token);
  };

  const logout = () => {
    setAdminEmail(null);
    setIsAuthenticated(false);
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminToken');
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
