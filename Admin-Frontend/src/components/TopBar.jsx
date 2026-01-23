import './TopBar.css';

const TopBar = ({ onLogout, onToggleSidebar }) => {
  const handleLogout = () => {
    onLogout();
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="sidebar-toggle" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="3" y1="6" x2="21" y2="6" strokeWidth="2" />
            <line x1="3" y1="12" x2="21" y2="12" strokeWidth="2" />
            <line x1="3" y1="18" x2="21" y2="18" strokeWidth="2" />
          </svg>
        </button>
        <div className="logo">
          <span className="logo-text">Muscle Garage</span>
          <span className="logo-badge">Admin</span>
        </div>
      </div>

      <div className="topbar-right">
        <div className="user-menu">
          <button
            className="logout-button"
            onClick={handleLogout}
            aria-label="Logout"
            title="Logout"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
