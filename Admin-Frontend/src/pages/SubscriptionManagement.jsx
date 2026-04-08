import { useState, useEffect, useRef } from 'react';
import draggerIcon from '../assets/dragger.png';
import './SubscriptionManagement.css';
import { API_URL } from '../utils/api';

const SubscriptionManagement = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState({ show: false, planId: null, planName: '' });
  const [deleting, setDeleting] = useState(false);
  const [editModal, setEditModal] = useState({ show: false, plan: null });
  const [createModal, setCreateModal] = useState({ show: false });
  const [formData, setFormData] = useState({ name: '', days: '', price: '', isActive: true });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [filters, setFilters] = useState({ active: false, inactive: false });
  const filterRef = useRef(null);
  const deleteModalRef = useRef(null);
  const editModalRef = useRef(null);
  const createModalRef = useRef(null);
  const [draggedPlanId, setDraggedPlanId] = useState(null);
  const [plansPage, setPlansPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    fetchPlans();
  }, []);

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
        setDeleteModal({ show: false, planId: null, planName: '' });
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
        setEditModal({ show: false, plan: null });
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

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/subscription/admin/plans`, {
        headers: {
          'Authorization': token,
        },
      });

      const data = await response.json();

      if (data.success) {
        setPlans(data.plans);
      } else {
        setError(data.message || 'Failed to fetch subscription plans');
      }
    } catch (err) {
      console.error('Fetch plans error:', err);
      setError('Failed to fetch subscription plans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (planId, planName) => {
    setDeleteModal({ show: true, planId, planName });
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);

      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/subscription/admin/plans/${deleteModal.planId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token,
        },
      });

      const data = await response.json();

      if (data.success) {
        setPlans(plans.filter(plan => plan._id !== deleteModal.planId));
        setDeleteModal({ show: false, planId: null, planName: '' });
      } else {
        alert(data.message || 'Failed to delete subscription plan');
      }
    } catch (err) {
      console.error('Delete plan error:', err);
      alert('Failed to delete subscription plan. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ show: false, planId: null, planName: '' });
  };

  const handleEditClick = (plan) => {
    setEditModal({ show: true, plan });
    setFormData({
      name: plan.name,
      days: String(plan.days),
      price: String(plan.price),
      isActive: plan.isActive !== false,
    });
    setFormError('');
  };

  const handleEditCancel = () => {
    setEditModal({ show: false, plan: null });
    setFormData({ name: '', days: '', price: '', isActive: true });
    setFormError('');
  };

  const handleCreateClick = () => {
    setCreateModal({ show: true });
    setFormData({ name: '', days: '', price: '', isActive: true });
    setFormError('');
  };

  const handleCreateCancel = () => {
    setCreateModal({ show: false });
    setFormData({ name: '', days: '', price: '', isActive: true });
    setFormError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setFormError('Plan name is required');
      return false;
    }
    if (!formData.days || isNaN(formData.days) || Number(formData.days) <= 0) {
      setFormError('Days must be a positive number');
      return false;
    }
    if (!formData.price || isNaN(formData.price) || Number(formData.price) <= 0) {
      setFormError('Price must be a positive number');
      return false;
    }
    return true;
  };

  const handleCreateSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setFormError('');

      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/subscription/admin/plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          days: Number(formData.days),
          price: Number(formData.price),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPlans([...plans, data.plan]);
        setCreateModal({ show: false });
        setFormData({ name: '', days: '', price: '', isActive: true });
      } else {
        setFormError(data.message || 'Failed to create subscription plan');
      }
    } catch (err) {
      console.error('Create plan error:', err);
      setFormError('Failed to create subscription plan. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setFormError('');

      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/subscription/admin/plans/${editModal.plan._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          days: Number(formData.days),
          price: Number(formData.price),
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPlans(plans.map(plan => plan._id === editModal.plan._id ? data.plan : plan));
        setEditModal({ show: false, plan: null });
        setFormData({ name: '', days: '', price: '', isActive: true });
      } else {
        setFormError(data.message || 'Failed to update subscription plan');
      }
    } catch (err) {
      console.error('Update plan error:', err);
      setFormError('Failed to update subscription plan. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFilterToggle = (filterName) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName],
    }));
  };

  const clearSearchAndFilters = () => {
    setSearchQuery('');
    setFilters({ active: false, inactive: false });
    setShowFilterDropdown(false);
  };

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchQuery.toLowerCase());
    const hasActiveFilter = filters.active || filters.inactive;
    
    if (!hasActiveFilter) return matchesSearch;
    
    let matchesFilter = false;
    if (filters.active && plan.isActive) matchesFilter = true;
    if (filters.inactive && !plan.isActive) matchesFilter = true;
    
    return matchesSearch && matchesFilter;
  });

  // Reset pagination when the filtered list or filters/search change
  useEffect(() => {
    setPlansPage(1);
  }, [filteredPlans.length, searchQuery, filters]);
  const reorderPlans = (currentPlans, draggedId, targetId) => {
    const updated = [...currentPlans];
    const fromIndex = updated.findIndex((plan) => plan._id === draggedId);
    const toIndex = updated.findIndex((plan) => plan._id === targetId);
    if (fromIndex === -1 || toIndex === -1) return currentPlans;
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    return updated;
  };

  const persistPlanOrder = async (orderedPlans) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/subscription/admin/plans/order`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
        body: JSON.stringify({
          planIds: orderedPlans.map((plan) => plan._id),
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to save plan order');
      }
    } catch (err) {
      console.error('Update plan order error:', err);
      alert('Failed to save plan order. Please try again.');
      fetchPlans();
    }
  };

  const handleDragStart = (planId) => {
    setDraggedPlanId(planId);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDragEnd = () => {
    setDraggedPlanId(null);
  };

  const handleDrop = async (targetPlanId) => {
    if (!draggedPlanId || draggedPlanId === targetPlanId) return;
    const updated = reorderPlans(plans, draggedPlanId, targetPlanId);
    setPlans(updated);
    setDraggedPlanId(null);
    await persistPlanOrder(updated);
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  if (loading) {
    return (
      <div className="subscription-management">
        <h1>Subscription Management</h1>
        <div className="subscription-management-content">
          <p style={{ color: '#666' }}>Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-management">
      <h1>Subscription Management</h1>

      <div className="subscription-management-content">
        {error && <div className="error-message">{error}</div>}

        {/* Search and Create Section */}
        <div className="sub-search-container">
          <div className="search-filter-section">
            <div className="search-filter-wrapper">
             
              <div className="search-box">
                <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search subscription plans..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="clear-search"
                    onClick={() => setSearchQuery('')}
                    title="Clear search"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>

              {/* Filter */}
              <div className="filter-container" ref={filterRef}>
                <button
                  className={`filter-button ${showFilterDropdown ? 'dropdown-open' : ''} ${activeFiltersCount > 0 ? 'has-filters' : ''}`}
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 3H2l8 9.46v7.54l6 2v-9.54L22 3z"></path>
                  </svg>
                  Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                </button>

                {showFilterDropdown && (
                  <div className="filter-dropdown">
                    <label className="filter-item">
                      <input
                        type="checkbox"
                        checked={filters.active}
                        onChange={() => handleFilterToggle('active')}
                      />
                      <span>Active Plans</span>
                    </label>
                    <label className="filter-item">
                      <input
                        type="checkbox"
                        checked={filters.inactive}
                        onChange={() => handleFilterToggle('inactive')}
                      />
                      <span>Inactive Plans</span>
                    </label>
                  </div>
                )}
              </div>

              <button
                className="subscription-clear-all-btn"
                onClick={clearSearchAndFilters}
                disabled={!searchQuery && activeFiltersCount === 0}
                title="Clear search and filters"
              >
                Clear
              </button>
            </div>

            {/* Create Button */}
            <button className="btn-create-plan" onClick={handleCreateClick}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Create Plan
            </button>
          </div>
        </div>

        {/* Plans Table */}
        {filteredPlans.length === 0 ? (
          <div className="no-data">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"></path>
            </svg>
            <p>{searchQuery ? 'No subscription plans found matching your search' : 'No subscription plans created yet'}</p>
            <button className="btn-create-plan-empty" onClick={handleCreateClick}>
              Create First Plan
            </button>
          </div>
        ) : (
          <div className="plans-table-wrapper">
            <table className="plans-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Plan Name</th>
                  <th>Duration</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans
                  .slice((plansPage - 1) * pageSize, plansPage * pageSize)
                  .map(plan => (
                  <tr
                    key={plan._id}
                    className={plan._id === draggedPlanId ? 'dragging' : ''}
                    draggable
                    onDragStart={() => handleDragStart(plan._id)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(plan._id)}
                    onDragEnd={handleDragEnd}
                  >
                    <td className="drag-handle" title="Drag to reorder">
                      <img
                        className="drag-handle-icon"
                        src={draggerIcon}
                        alt="Drag"
                      />
                    </td>
                    <td className="plan-name">{plan.name}</td>
                    <td>{plan.days} days</td>
                    <td className="plan-price">Rs. {plan.price.toLocaleString()}</td>
                    <td>
                      <span className={`status-badge ${plan.isActive ? 'active' : 'inactive'}`}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(plan.createdAt).toLocaleDateString()}</td>
                    <td className="actions">
                      <button
                        className="edit-btn"
                        onClick={() => handleEditClick(plan)}
                        title="Edit plan"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteClick(plan._id, plan.name)}
                        title="Delete plan"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPlans.length > pageSize && (
              <div className="table-pagination">
                <button
                  className="page-btn"
                  onClick={() => setPlansPage((p) => Math.max(1, p - 1))}
                  disabled={plansPage === 1}
                >
                  Prev
                </button>
                <span className="page-info">Page {plansPage} of {Math.ceil(filteredPlans.length / pageSize)}</span>
                <button
                  className="page-btn"
                  onClick={() => setPlansPage((p) => Math.min(Math.ceil(filteredPlans.length / pageSize), p + 1))}
                  disabled={plansPage >= Math.ceil(filteredPlans.length / pageSize)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal" ref={deleteModalRef}>
            <div className="modal-header">
              <h2>Delete Subscription Plan</h2>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete the subscription plan <strong>{deleteModal.planName}</strong>?
              </p>
              <p className="modal-subtitle">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleDeleteCancel} disabled={deleting}>
                Cancel
              </button>
              <button className="btn-delete-confirm" onClick={handleDeleteConfirm} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Plan Modal */}
      {createModal.show && (
        <div className="modal-overlay">
          <div className="modal-content create-plan-modal" ref={createModalRef}>
            <div className="modal-header">
              <h2>Create New Subscription Plan</h2>
              <button
                className="modal-close-btn"
                onClick={handleCreateCancel}
                disabled={submitting}
                title="Close"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body create-plan-body">
              {formError && <div className="form-error">{formError}</div>}
              <div className="form-group">
                <label>Plan Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., 1 Month"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={submitting}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Days *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g., 30"
                    value={formData.days}
                    onChange={(e) => setFormData({ ...formData, days: e.target.value })}
                    disabled={submitting}
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>Price (Rs.) *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g., 1500"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    disabled={submitting}
                    min="1"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Subscription Status:</label>
                <select
                  className="form-input"
                  value={formData.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                  disabled={submitting}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleCreateCancel} disabled={submitting}>
                Cancel
              </button>
              <button className="btn-submit" onClick={handleCreateSubmit} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Plan Modal */}
      {editModal.show && (
        <div className="modal-overlay">
          <div className="modal-content edit-plan-modal" ref={editModalRef}>
            <div className="modal-header">
              <h2>Edit Subscription Plan</h2>
              <button
                className="modal-close-btn"
                onClick={handleEditCancel}
                disabled={submitting}
                title="Close"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body edit-plan-body">
              {formError && <div className="form-error">{formError}</div>}
              <div className="form-group">
                <label>Plan Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., 1 Month"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={submitting}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Days *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g., 30"
                    value={formData.days}
                    onChange={(e) => setFormData({ ...formData, days: e.target.value })}
                    disabled={submitting}
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>Price (Rs.) *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g., 1500"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    disabled={submitting}
                    min="1"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Subscription Status:</label>
                <select
                  className="form-input"
                  value={formData.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                  disabled={submitting}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleEditCancel} disabled={submitting}>
                Cancel
              </button>
              <button className="btn-submit" onClick={handleUpdateSubmit} disabled={submitting}>
                {submitting ? 'Updating...' : 'Update Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;
