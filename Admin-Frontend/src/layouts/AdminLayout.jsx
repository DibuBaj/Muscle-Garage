import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      <TopBar onLogout={handleLogout} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="admin-main">
        <Sidebar isOpen={sidebarOpen} />
        <main className="admin-content">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default AdminLayout;
