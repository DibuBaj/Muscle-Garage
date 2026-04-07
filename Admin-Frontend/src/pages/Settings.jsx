import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import logoImage from '../assets/logo.png';
import './Settings.css';

const Settings = () => {
  const { adminEmail } = useAuth();
  const logoPreview = logoImage;
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage('New password and confirmation do not match.');
      return;
    }

    // TODO: Wire up to real password update endpoint
    setMessage('Password change request submitted.');
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
      </div>

      <div className="settings-card">
        <div className="logo-row">
          <div className="logo-preview">
            <img src={logoPreview} alt="Logo preview" />
          </div>
          <span className="admin-badge">Admin</span>
        </div>

        <div className="info-row">
          <span className="info-label">Email</span>
          <span className="info-value">{adminEmail || 'admin@example.com'}</span>
        </div>

        <form className="password-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              placeholder="Enter current password"
              required
            />
          </div>

          <div className="form-row">
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              placeholder="Enter new password"
              required
            />
          </div>

          <div className="form-row">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              placeholder="Re-enter new password"
              required
            />
          </div>

          {message && <div className="form-message">{message}</div>}

          <div className="form-actions">
            <button type="submit" className="primary-btn">Update Password</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
