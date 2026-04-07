import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const RootRedirect = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: 'var(--primary-color)'
      }}>
        Loading...
      </div>
    );
  }

  // If user is authenticated, redirect to dashboard
  // Otherwise redirect to login
  return isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/login" replace />;
};

export default RootRedirect;
