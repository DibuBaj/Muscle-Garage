import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { API_URL } from '../utils/api';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen] = useState(true);
  const [logoutModal, setLogoutModal] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [newBookingsCount, setNewBookingsCount] = useState(0);
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

      setNewOrdersCount(unfulfilledCount);
    } catch (err) {
      console.error('Failed to fetch orders count', err);
    }
  }, []);

  const fetchNewBookingsCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const res = await fetch(`${API_URL}/api/booking/admin/all`, {
        headers: {
          Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!data.success) return;

      const activeBookingCount = (data.bookings || []).filter(
        (b) => (b.status || '').toLowerCase() === 'active'
      ).length;

      setNewBookingsCount(activeBookingCount);
    } catch (err) {
      console.error('Failed to fetch bookings count', err);
    }
  }, []);

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
    fetchNewBookingsCount();
    const intervalId = setInterval(fetchNewOrdersCount, 20000);
    const bookingIntervalId = setInterval(fetchNewBookingsCount, 20000);
    return () => {
      clearInterval(intervalId);
      clearInterval(bookingIntervalId);
    };
  }, [fetchNewOrdersCount, fetchNewBookingsCount]);

  return (
    <div className="admin-layout">
      <div className="admin-main">
        <Sidebar 
          isOpen={sidebarOpen} 
          onLogout={handleLogoutClick} 
          newOrdersCount={location.pathname === '/admin/supplement-store' ? 0 : newOrdersCount}
          newBookingsCount={location.pathname === '/admin/trainer-management' ? 0 : newBookingsCount}
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
