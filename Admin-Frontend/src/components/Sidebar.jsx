import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import './Sidebar.css';
import logo from '../assets/logo.png';

const Sidebar = ({ isOpen, onLogout }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const baseUrl = import.meta.env.BASE_URL || '/';
  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-logo">
        <img
          src={logo}
          alt="Muscle Garage"
          className="sidebar-logo-img"
        />
        <span className="sidebar-admin-badge">Admin</span>
      </div>
      
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

        <Link
          to="/admin/subscription-management"
          className={`nav-link ${isActive('/admin/subscription-management') ? 'active' : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" strokeWidth="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" strokeWidth="2" />
          </svg>
          <span>Subscription</span>
        </Link>

        <Link
          to="/admin/trainer-management"
          className={`nav-link ${isActive('/admin/trainer-management') ? 'active' : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="8" r="3" strokeWidth="2" />
            <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" strokeWidth="2" />
            <path d="M8 11l-3 3-3-3" strokeWidth="2" />
            <path d="M16 11l3 3 3-3" strokeWidth="2" />
          </svg>
          <span>Trainer/Session</span>
        </Link>
      </nav>
      
      <div className="sidebar-bottom">
        <Link
          to="/admin/settings"
          className={`nav-link ${isActive('/admin/settings') ? 'active' : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          <span>Settings</span>
        </Link>
        
        <button className="nav-link logout-btn" onClick={onLogout}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
