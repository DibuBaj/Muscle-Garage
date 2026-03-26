import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [logoutModal, setLogoutModal] = useState(false);
  const logoutModalRef = useRef(null);

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

  return (
    <div className="admin-layout">
      <div className="admin-main">
        <Sidebar isOpen={sidebarOpen} onLogout={handleLogoutClick} />
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
