import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ isOpen }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <nav className="sidebar-nav">
        <Link
          to="/admin/dashboard"
          className={`nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="3" width="7" height="7" strokeWidth="2" />
            <rect x="14" y="3" width="7" height="7" strokeWidth="2" />
            <rect x="14" y="14" width="7" height="7" strokeWidth="2" />
            <rect x="3" y="14" width="7" height="7" strokeWidth="2" />
          </svg>
          <span>Dashboard</span>
        </Link>

        <Link
          to="/admin/user-management"
          className={`nav-link ${isActive('/admin/user-management') ? 'active' : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeWidth="2" />
            <circle cx="9" cy="7" r="4" strokeWidth="2" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeWidth="2" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeWidth="2" />
          </svg>
          <span>User Management</span>
        </Link>
      </nav>
    </aside>
  );
};

export default Sidebar;
