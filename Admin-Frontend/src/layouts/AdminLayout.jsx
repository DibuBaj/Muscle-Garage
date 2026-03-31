import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { API_URL } from '../utils/api';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [logoutModal, setLogoutModal] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const logoutModalRef = useRef(null);

  const fetchNewOrdersCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const res = await fetch(`${API_URL}/api/orders/admin/all`, {
        headers: {
          Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!data.success) return;

      const unfulfilledCount = (data.orders || []).filter(
        (o) => (o.status || '').toLowerCase() === 'unfulfilled'
      ).length;

      // Clear the badge when the admin is already viewing the store
      if (location.pathname === '/admin/supplement-store') {
        setNewOrdersCount(0);
      } else {
        setNewOrdersCount(unfulfilledCount);
      }
    } catch (err) {
      console.error('Failed to fetch orders count', err);
    }
  }, [location.pathname]);

  const handleLogoutClick = () => {
    setLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    setLogoutModal(false);
    navigate('/login');
  };

  const handleLogoutCancel = () => {
    setLogoutModal(false);
  };

  useEffect(() => {
    const handleModalClickOutside = (event) => {
      if (logoutModalRef.current && !logoutModalRef.current.contains(event.target)) {
        setLogoutModal(false);
      }
    };

    if (logoutModal) {
      document.addEventListener('mousedown', handleModalClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleModalClickOutside);
    };
  }, [logoutModal]);

  // Poll for new orders periodically; clear badge when viewing the supplement store
  useEffect(() => {
    fetchNewOrdersCount();
    const intervalId = setInterval(fetchNewOrdersCount, 20000);
    return () => clearInterval(intervalId);
  }, [fetchNewOrdersCount]);

  useEffect(() => {
    if (location.pathname === '/admin/supplement-store') {
      setNewOrdersCount(0);
    }
  }, [location.pathname]);

  return (
    <div className="admin-layout">
      <div className="admin-main">
        <Sidebar 
          isOpen={sidebarOpen} 
          onLogout={handleLogoutClick} 
          newOrdersCount={newOrdersCount}
        />
        <main className="admin-content">
          {children}
        </main>
      </div>
      <Footer />

      {/* Logout Confirmation Modal */}
      {logoutModal && (
        <div className="modal-overlay">
          <div className="modal-content" ref={logoutModalRef}>
            <div className="modal-header">
              <h2>Confirm Logout</h2>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to logout?</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-cancel" 
                onClick={handleLogoutCancel}
              >
                No, Cancel
              </button>
              <button 
                className="btn-confirm btn-logout" 
                onClick={handleLogoutConfirm}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
