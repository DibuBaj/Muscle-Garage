import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/useAuth';
import logoImage from '../assets/logo.png';
import './Settings.css';
import { API_URL } from '../utils/api';

const Settings = () => {
  const { adminEmail } = useAuth();
  const logoPreview = logoImage;
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage('New password and confirmation do not match.');
      return;
    }

    const adminToken = localStorage.getItem('adminToken');

    if (!adminToken) {
      setMessage('Your session has expired. Please log in again.');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/api/auth/admin-change-password`,
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      if (response.data?.success) {
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }

      setMessage(response.data?.message || 'Password updated successfully.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
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
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
