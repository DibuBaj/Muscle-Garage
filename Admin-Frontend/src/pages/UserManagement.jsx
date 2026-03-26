import { useState, useEffect, useRef } from 'react';
import './UserManagement.css';
import { API_URL } from '../utils/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState({ show: false, userId: null, userName: '' });
  const [deleting, setDeleting] = useState(false);
  const [editModal, setEditModal] = useState({ show: false, user: null });
  const [pauseData, setPauseData] = useState({ startDate: '', endDate: '' });
  const [subscriptionData, setSubscriptionData] = useState({ membershipId: '', totalDays: '' });
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDateInputType, setStartDateInputType] = useState('text');
  const [endDateInputType, setEndDateInputType] = useState('text');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [filters, setFilters] = useState({
    active: false,
    notSubscribed: false,
    expired: false,
    paused: false
  });
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [createModal, setCreateModal] = useState({ show: false });
  const [createFormData, setCreateFormData] = useState({ fullname: '', email: '', phone: '' });
  const [createFormError, setCreateFormError] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);
  const filterRef = useRef(null);
  const deleteModalRef = useRef(null);
  const editModalRef = useRef(null);
  const createModalRef = useRef(null);

  useEffect(() => {
    fetchUsers();
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_URL}/api/subscription/plans/active`);
      const data = await response.json();

      if (data.success) {
        const orderedPlans = [...data.plans].sort((a, b) => {
          const orderA = Number.isFinite(a.order) ? a.order : Number.MAX_SAFE_INTEGER;
          const orderB = Number.isFinite(b.order) ? b.order : Number.MAX_SAFE_INTEGER;
          return orderA - orderB;
        });
        setPlans(orderedPlans);
      } else {
        console.error('Failed to fetch subscription plans:', data.message);
        // Use fallback static plans if API fails
        setPlans([
          { _id: '1_month', name: '1 Month', price: 1500, days: 30 },
          { _id: '3_months', name: '3 Months', price: 4000, days: 90 },
          { _id: '12_months', name: '12 Months', price: 17000, days: 365 },
        ]);
      }
    } catch (err) {
      console.error('Fetch plans error:', err);
      // Use fallback static plans if API fails
      setPlans([
        { _id: '1_month', name: '1 Month', price: 1500, days: 30 },
        { _id: '3_months', name: '3 Months', price: 4000, days: 90 },
        { _id: '12_months', name: '12 Months', price: 17000, days: 365 },
      ]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
    };

    if (showFilterDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterDropdown]);

  useEffect(() => {
    const handleModalClickOutside = (event) => {
      if (deleteModalRef.current && !deleteModalRef.current.contains(event.target)) {
        setDeleteModal({ show: false, userId: null, userName: '' });
      }
    };

    if (deleteModal.show) {
      document.addEventListener('mousedown', handleModalClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleModalClickOutside);
    };
  }, [deleteModal.show]);

  useEffect(() => {
    const handleModalClickOutside = (event) => {
      if (editModalRef.current && !editModalRef.current.contains(event.target)) {
        setEditModal({ show: false, user: null });
      }
    };

    if (editModal.show) {
      document.addEventListener('mousedown', handleModalClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleModalClickOutside);
    };
  }, [editModal.show]);

  useEffect(() => {
    const handleModalClickOutside = (event) => {
      if (createModalRef.current && !createModalRef.current.contains(event.target)) {
        setCreateModal({ show: false });
      }
    };

    if (createModal.show) {
      document.addEventListener('mousedown', handleModalClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleModalClickOutside);
    };
  }, [createModal.show]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/user/admin/all`, {
        headers: {
          'Authorization': token
        }
      });

      const data = await response.json();

      if (data.success) {
        // Fetch subscription details for each user from backend to get calculated daysLeft
        const usersWithSubscriptions = await Promise.all(
          data.users.map(async (user) => {
            if (user.subscription && user.subscription._id) {
              try {
                const subResponse = await fetch(`${API_URL}/api/subscription/admin/get/${user._id}`, {
                  headers: {
                    'Authorization': token
                  }
                });
                const subData = await subResponse.json();
                if (subData.success && subData.subscription) {
                  return { ...user, subscription: subData.subscription };
                }
              } catch (err) {
                console.error(`Failed to fetch subscription for user ${user._id}:`, err);
              }
            }
            return user;
          })
        );
        setUsers(usersWithSubscriptions);
      } else {
        setError(data.message || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Fetch users error:', err);
      setError('Failed to fetch users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (userId, userName) => {
    setDeleteModal({ show: true, userId, userName });
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/user/admin/${deleteModal.userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token
        }
      });

      const data = await response.json();

      if (data.success) {
        // Remove user from the list
        setUsers(users.filter(user => user.id !== deleteModal.userId));
        setDeleteModal({ show: false, userId: null, userName: '' });
      } else {
        alert(data.message || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Delete user error:', err);
      alert('Failed to delete user. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ show: false, userId: null, userName: '' });
  };

  const handleEditClick = (user) => {
    setEditModal({ show: true, user });
    setPauseData({ startDate: '', endDate: '' });
    setSubscriptionData({ membershipId: '', totalDays: '' });
    setSelectedPlan(null);
    setStartDateInputType('text');
    setEndDateInputType('text');
  };

  const handleEditCancel = () => {
    setEditModal({ show: false, user: null });
    setPauseData({ startDate: '', endDate: '' });
    setSubscriptionData({ membershipId: '', totalDays: '' });
    setSelectedPlan(null);
  };

  // Ensure clicking a date input opens the browser date picker
  const openDatePicker = (e) => {
    try {
      const input = e?.target;
      if (!input) return;
      if (typeof input.showPicker === 'function') {
        e.preventDefault();
        input.showPicker();
      } else {
        setTimeout(() => {
          if (typeof input.showPicker === 'function') {
            try { input.showPicker(); } catch (_) {}
          }
        }, 0);
      }
    } catch (_) {
      // Ignore if showPicker is unsupported; native behavior will apply
    }
  };

  // Open picker on first click by preventing default, flipping type, and showing picker
  const handleDateMouseDown = (e, setType) => {
    e.preventDefault();
    const input = e?.target;
    if (!input) return;
    setType('date');
    // After type flips on next tick, show picker
    setTimeout(() => {
      try {
        if (typeof input.showPicker === 'function') {
          input.showPicker();
        }
        // Clear any text selection artifacts
        if (typeof input.setSelectionRange === 'function') {
          input.setSelectionRange(0, 0);
        }
        if (typeof window !== 'undefined' && window.getSelection) {
          const sel = window.getSelection();
          if (sel && sel.removeAllRanges) sel.removeAllRanges();
        }
        input.focus();
      } catch (_) {}
    }, 0);
  };

  const handlePauseSubscription = async () => {
    if (!pauseData.startDate || !pauseData.endDate) {
      alert('Please select both start and end dates');
      return;
    }

    const start = new Date(pauseData.startDate);
    const end = new Date(pauseData.endDate);
    
    if (end <= start) {
      alert('End date must be after start date');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/subscription/admin/pause/${editModal.user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate: pauseData.startDate,
          endDate: pauseData.endDate
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Subscription paused successfully');
        handleEditCancel();
        fetchUsers();
      } else {
        alert(data.message || 'Failed to pause subscription');
      }
    } catch (err) {
      console.error('Pause subscription error:', err);
      alert('Failed to pause subscription. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnpauseSubscription = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/subscription/admin/resume/${editModal.user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        alert('Subscription unpaused successfully');
        handleEditCancel();
        fetchUsers();
      } else {
        alert(data.message || 'Failed to unpause subscription');
      }
    } catch (err) {
      console.error('Unpause subscription error:', err);
      alert('Failed to unpause subscription. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetSubscription = async () => {
    if (!selectedPlan) {
      alert('Please select a subscription plan');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/subscription/admin/set/${editModal.user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan: selectedPlan
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Subscription set successfully');
        handleEditCancel();
        fetchUsers();
      } else {
        alert(data.message || 'Failed to set subscription');
      }
    } catch (err) {
      console.error('Set subscription error:', err);
      alert('Failed to set subscription. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateDaysLeft = (subscription) => {
    if (!subscription) return 0;

    if (typeof subscription.daysLeft === 'number') {
      return Math.max(0, subscription.daysLeft);
    }

    if (!subscription.startDate || !subscription.endDate) {
      return 0;
    }

    const now = new Date();
    const startDate = new Date(subscription.startDate);
    const dayMs = 1000 * 60 * 60 * 24;

    const totalDays = Number.isFinite(subscription.totalDays)
      ? subscription.totalDays
      : Math.ceil((new Date(subscription.endDate).getTime() - startDate.getTime()) / dayMs);
    if (totalDays <= 0) return 0;

    const elapsedDays = Math.max(0, Math.floor((now.getTime() - startDate.getTime()) / dayMs));

    let pausedDays = 0;
    if (subscription.pauseInfo?.pauseStartDate && subscription.pauseInfo?.pauseEndDate) {
      const pauseStart = new Date(subscription.pauseInfo.pauseStartDate);
      const pauseEnd = new Date(subscription.pauseInfo.pauseEndDate);

      if (pauseEnd > pauseStart && now > pauseStart) {
        const pausedUntil = now < pauseEnd ? now : pauseEnd;
        pausedDays = Math.ceil((pausedUntil.getTime() - pauseStart.getTime()) / dayMs);
      }
    }

    const activeElapsedDays = Math.max(0, elapsedDays - pausedDays);
    const daysLeft = totalDays - activeElapsedDays;
    return Math.max(0, daysLeft);
  };

  const getSubscriptionStatus = (subscription) => {
    if (!subscription || !subscription.membershipId) {
      return { status: 'Not Subscribed', className: 'status-inactive' };
    }

    const daysLeft = calculateDaysLeft(subscription);

    if (daysLeft <= 0) {
      return { status: 'Expired', className: 'status-expired' };
    }

    if (subscription.status === 'pause') {
      return { status: 'Paused', className: 'status-paused' };
    }

    return { status: 'Active', className: 'status-active' };
  };

  const getSubscriptionDetails = (subscription) => {
    if (!subscription || !subscription.membershipId) {
      return 'N/A';
    }

    const calculatedDaysLeft = calculateDaysLeft(subscription);
    return `${subscription.membershipId} (${calculatedDaysLeft}/${subscription.totalDays} days)`;
  };

  // Filter users based on search query and status filters
  let filteredUsers = users.filter(user => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        user.fullname.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.memberId.toLowerCase().includes(query)
      );
      if (!matchesSearch) return false;
    }

    // Status filter
    const hasActiveFilter = filters.active || filters.notSubscribed || filters.expired || filters.paused;
    if (hasActiveFilter) {
      const subscriptionStatus = getSubscriptionStatus(user.subscription);
      const status = subscriptionStatus.status;
      
      if (filters.active && status === 'Active') return true;
      if (filters.notSubscribed && status === 'Not Subscribed') return true;
      if (filters.expired && status === 'Expired') return true;
      if (filters.paused && status === 'Paused') return true;
      
      return false;
    }
    
    return true;
  });

  const handleFilterChange = (filterName) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  const handleCreateClick = () => {
    setCreateModal({ show: true });
    setCreateFormData({ fullname: '', email: '', phone: '' });
    setCreateFormError('');
  };

  const handleCreateCancel = () => {
    setCreateModal({ show: false });
    setCreateFormData({ fullname: '', email: '', phone: '' });
    setCreateFormError('');
  };

  const handleCreateSubmit = async () => {
    // Validate form
    if (!createFormData.fullname.trim() || !createFormData.email.trim()) {
      setCreateFormError('Full name and email are required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(createFormData.email)) {
      setCreateFormError('Please enter a valid email');
      return;
    }

    // Phone validation (if provided)
    if (createFormData.phone.trim()) {
      const phoneRegex = /^[\+]?[1-9][\d]{9}$/;
      if (!phoneRegex.test(createFormData.phone.replace(/[\s\-\(\)]/g, ''))) {
        setCreateFormError('Please enter a valid 10-digit phone number');
        return;
      }
    }

    try {
      setCreatingUser(true);
      setCreateFormError('');

      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/user/admin/create`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullname: createFormData.fullname.trim(),
          email: createFormData.email.trim(),
          phone: createFormData.phone.trim() || undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('User created successfully! User ID: ' + data.user.memberId);
        handleCreateCancel();
        fetchUsers();
      } else {
        setCreateFormError(data.message || 'Failed to create user');
      }
    } catch (err) {
      console.error('Create user error:', err);
      setCreateFormError('Failed to create user. Please try again.');
    } finally {
      setCreatingUser(false);
    }
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  if (loading) {
    return (
      <div className="user-management">
        <h1>User Management</h1>
        <div className="user-management-content">
          <div className="loading-spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management">
      <h1>User Management</h1>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="user-search-container">
        <div className="search-filter-section">
          <div className="search-filter-wrapper">
           
            <div className="search-box">
              <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search Member"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="clear-search" onClick={() => setSearchQuery('')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>
            <div className="filter-container" ref={filterRef}>
              <button
                className={`filter-button ${activeFilterCount > 0 ? 'has-filters' : ''} ${showFilterDropdown ? 'dropdown-open' : ''}`}
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                title="Filter users"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
                Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
              </button>
              {showFilterDropdown && (
                <div className="filter-dropdown">
                <div className="filter-header">Filter by Status</div>
                <label className="filter-option">
                  <input
                    type="checkbox"
                    checked={filters.active}
                    onChange={() => handleFilterChange('active')}
                  />
                  <span>Active</span>
                </label>
                <label className="filter-option">
                  <input
                    type="checkbox"
                    checked={filters.notSubscribed}
                    onChange={() => handleFilterChange('notSubscribed')}
                  />
                  <span>Not Subscribed</span>
                </label>
                <label className="filter-option">
                  <input
                    type="checkbox"
                    checked={filters.expired}
                    onChange={() => handleFilterChange('expired')}
                  />
                  <span>Expired</span>
                </label>
                <label className="filter-option">
                  <input
                    type="checkbox"
                    checked={filters.paused}
                    onChange={() => handleFilterChange('paused')}
                  />
                  <span>Paused</span>
                </label>
              </div>
            )}
          </div>
          </div>
          <button
            className="create-user-button"
            onClick={handleCreateClick}
            title="Create New User"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Create
          </button>
        </div>
        <div className="search-results-count">
          {(searchQuery || activeFilterCount > 0)
            ? `Found ${filteredUsers.length} of ${users.length} users`
            : `Total ${users.length} users`}
        </div>
      </div>

      <div className="user-management-content">
        {filteredUsers.length === 0 ? (
          <div className="no-users">
            <p>{searchQuery ? 'No users found matching your search' : 'No users found'}</p>
          </div>
        ) : (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>User ID</th>
                  <th>Full Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Subscription Status</th>
                  <th>Subscription Details</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => {
                  const subscriptionStatus = getSubscriptionStatus(user.subscription);
                  return (
                    <tr key={user.id}>
                      <td>{index + 1}</td>
                      <td className="user-id">{user.memberId}</td>
                      <td>{user.fullname}</td>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{user.phone || '-'}</td>
                      <td>
                        <span className={`status-badge ${subscriptionStatus.className}`}>
                          {subscriptionStatus.status}
                        </span>
                      </td>
                      <td className="subscription-details">
                        {getSubscriptionDetails(user.subscription)}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="edit-btn"
                            onClick={() => handleEditClick(user)}
                            title="Edit User"
                          >
                            <svg 
                              width="20" 
                              height="20" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteClick(user.id, user.fullname)}
                            title="Delete User"
                          >
                            <svg 
                              width="20" 
                              height="20" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="modal-overlay">
          <div className="modal-content" ref={deleteModalRef}>
            <div className="modal-header">
              <h2>Confirm Delete</h2>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete the user <strong>{deleteModal.userName}</strong>?</p>
              <p className="warning-text">This action cannot be undone and will also delete the user's subscription.</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-cancel" 
                onClick={handleDeleteCancel}
                disabled={deleting}
              >
                No, Cancel
              </button>
              <button 
                className="btn-confirm" 
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editModal.show && editModal.user && (
        <div className="modal-overlay">
          <div className="modal-content edit-modal" ref={editModalRef}>
            <div className="modal-header">
              <h2>Edit User: {editModal.user.fullname}</h2>
            </div>
            <div className="modal-body edit-modal-body">
              <div className="user-info-section">
                <p><strong>Member ID:</strong> {editModal.user.memberId}</p>
                <p><strong>Email:</strong> {editModal.user.email}</p>
                <p><strong>Current Status:</strong> <span className={`status-badge ${getSubscriptionStatus(editModal.user.subscription).className}`}>
                  {getSubscriptionStatus(editModal.user.subscription).status}
                </span></p>
              </div>

              {/* Pause/Unpause Subscription Section - only for active/paused (not for expired or no subscription) */}
              {editModal.user.subscription &&
               editModal.user.subscription.membershipId &&
               calculateDaysLeft(editModal.user.subscription) > 0 && (
                <div className="edit-section">
                  {editModal.user.subscription.status === 'pause' ? (
                    <>
                      <h3>Unpause Subscription</h3>
                      <p className="section-description">Resume the user's paused subscription</p>
                      <button 
                        className="btn-action btn-unpause"
                        onClick={handleUnpauseSubscription}
                        disabled={submitting}
                      >
                        {submitting ? 'Processing...' : 'Unpause Subscription'}
                      </button>
                    </>
                  ) : (
                    <>
                      <h3>Pause Subscription</h3>
                      <p className="section-description">Set a pause period for the user's subscription</p>
                      <div className="form-group">
                        <label>Start Date</label>
                        <input
                          type={startDateInputType}
                          value={pauseData.startDate}
                          onChange={(e) => setPauseData({ ...pauseData, startDate: e.target.value })}
                          onMouseDown={(e) => handleDateMouseDown(e, setStartDateInputType)}
                          onBlur={() => { if (!pauseData.startDate) setStartDateInputType('text'); }}
                          placeholder="mm/dd/yyyy"
                          readOnly={startDateInputType === 'text'}
                          className="form-input date-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>End Date</label>
                        <input
                          type={endDateInputType}
                          value={pauseData.endDate}
                          onChange={(e) => setPauseData({ ...pauseData, endDate: e.target.value })}
                          onMouseDown={(e) => handleDateMouseDown(e, setEndDateInputType)}
                          onBlur={() => { if (!pauseData.endDate) setEndDateInputType('text'); }}
                          placeholder="mm/dd/yyyy"
                          readOnly={endDateInputType === 'text'}
                          className="form-input date-input"
                        />
                      </div>
                      <button 
                        className="btn-action btn-pause"
                        onClick={handlePauseSubscription}
                        disabled={submitting}
                      >
                        {submitting ? 'Processing...' : 'Pause Subscription'}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Set/Renew Subscription Section - Only show if not active */}
              {(!editModal.user.subscription || 
                !editModal.user.subscription.membershipId || 
                calculateDaysLeft(editModal.user.subscription) <= 0) && (
                <div className="edit-section">
                  <h3>{editModal.user.subscription?.membershipId ? 'Renew Subscription' : 'Set Subscription'}</h3>
                  <p className="section-description">Add or renew subscription for this user</p>

                  {/* Plan Selector (like user panel) */}
                  <div className="plan-selector">
                    <div className="plan-cards">
                      {plans.map((plan) => (
                        <button
                          key={plan._id}
                          type="button"
                          className={`plan-card ${selectedPlan === plan._id ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedPlan(plan._id);
                            setSubscriptionData({ membershipId: plan._id, totalDays: String(plan.days) });
                          }}
                        >
                          <div className="plan-label">{plan.name}</div>
                          <div className="plan-price">Rs. {plan.price}</div>
                          <div className="plan-days">({plan.days} days)</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  
                  <button 
                    className="btn-action btn-set"
                    onClick={handleSetSubscription}
                    disabled={submitting}
                  >
                    {submitting ? 'Processing...' : 'Set Subscription'}
                  </button>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn-cancel" 
                onClick={handleEditCancel}
                disabled={submitting}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {createModal.show && (
        <div className="modal-overlay">
          <div className="modal-content create-user-modal" ref={createModalRef}>
            <div className="modal-header">
              <h2>Create New User</h2>
              <button 
                className="modal-close-btn"
                onClick={handleCreateCancel}
                disabled={creatingUser}
                title="Close"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body create-user-body">
              {createFormError && (
                <div className="form-error">
                  {createFormError}
                </div>
              )}
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter full name"
                  value={createFormData.fullname}
                  onChange={(e) => setCreateFormData({ ...createFormData, fullname: e.target.value })}
                  disabled={creatingUser}
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="Enter email address"
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                  disabled={creatingUser}
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="Enter 10-digit phone number"
                  value={createFormData.phone}
                  onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                  disabled={creatingUser}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-cancel" 
                onClick={handleCreateCancel}
                disabled={creatingUser}
              >
                Cancel
              </button>
              <button 
                className="btn-create" 
                onClick={handleCreateSubmit}
                disabled={creatingUser}
              >
                {creatingUser ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

