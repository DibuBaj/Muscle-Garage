import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import SubscriptionManagement from './pages/SubscriptionManagement';
import TrainerManagement from './pages/TrainerManagement';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/user-management" element={<UserManagement />} />
                    <Route path="/subscription-management" element={<SubscriptionManagement />} />
                    <Route path="/trainer-management" element={<TrainerManagement />} />
                    <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
                  </Routes>
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
