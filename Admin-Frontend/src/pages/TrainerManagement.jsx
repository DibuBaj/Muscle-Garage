import { useState, useEffect } from 'react';
import './TrainerManagement.css';

const TRAINER_TYPES = [
  'Weight Lifting',
  'CrossFit',
  'Yoga',
  'Cardio',
  'Pilates',
  'Boxing',
  'Fitness',
  'Strength & Conditioning',
  'Personal Training',
  'Group Fitness'
];

const SESSION_TYPES = [
  'Weight Lifting',
  'CrossFit',
  'Yoga',
  'Cardio',
  'Pilates',
  'Boxing',
  'Fitness',
  'Strength & Conditioning',
  'Personal Training',
  'Group Fitness'
];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TrainerManagement = () => {
  // State for trainers and sessions
  const [trainers, setTrainers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [createModal, setCreateModal] = useState({ show: false });
  const [modalTab, setModalTab] = useState('trainer'); // 'trainer' or 'session'
  
  // Trainer form state
  const [trainerForm, setTrainerForm] = useState({
    name: '',
    type: '',
    experience: '',
    certification: null,
    phone: '',
    socialMedia: {
      instagram: '',
      facebook: '',
      x: ''
    },
    rate: '',
    isActive: true
  });

  // Session form state
  const [sessionForm, setSessionForm] = useState({
    type: '',
    time: '',
    duration: '',
    rate: '',
    maxCapacity: '',
    dayOfWeek: '',
    phone: '',
    isActive: true
  });

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit modal states
  const [editModal, setEditModal] = useState({ show: false, type: null, id: null, data: null });
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete modal states
  const [deleteModal, setDeleteModal] = useState({ show: false, type: null, id: null, name: '' });
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Fetch trainers and sessions on mount
  useEffect(() => {
    fetchTrainersAndSessions();
  }, []);

  // Prevent scroll wheel from changing number input values
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.target.type === 'number') {
        e.preventDefault();
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });
    return () => document.removeEventListener('wheel', handleWheel, { passive: false });
  }, []);

  const fetchTrainersAndSessions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const trainerRes = await fetch('http://localhost:5000/api/trainer/all');
      const sessionRes = await fetch('http://localhost:5000/api/session/all');

      const trainerData = await trainerRes.json();
      const sessionData = await sessionRes.json();

      if (trainerData.success) {
        setTrainers(trainerData.trainers);
      }
      if (sessionData.success) {
        setSessions(sessionData.sessions);
      }
      
      setError('');
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    setCreateModal({ show: true });
    setModalTab('trainer');
    resetForm();
  };

  const handleCreateCancel = () => {
    setCreateModal({ show: false });
    resetForm();
  };

  const resetForm = () => {
    setTrainerForm({
      name: '',
      type: '',
      experience: '',
      certification: null,
      phone: '',
      socialMedia: {
        instagram: '',
        facebook: '',
        x: ''
      },
      rate: '',
      isActive: true
    });
    setSessionForm({
      type: '',
      time: '',
      duration: '',
      rate: '',
      maxCapacity: '',
      dayOfWeek: '',
      phone: '',
      isActive: true
    });
    setFormError('');
  };

  const handleModalTabChange = (tab) => {
    setModalTab(tab);
    setFormError('');
  };

  const handleTrainerFormChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('socialMedia_')) {
      const key = name.replace('socialMedia_', '');
      setTrainerForm(prev => ({
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          [key]: value
        }
      }));
    } else {
      setTrainerForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSessionFormChange = (e) => {
    const { name, value } = e.target;
    setSessionForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCertificationChange = (e) => {
    const file = e.target.files[0];
    setTrainerForm(prev => ({
      ...prev,
      certification: file
    }));
  };

  const validateTrainerForm = () => {
    if (!trainerForm.name.trim()) {
      setFormError('Trainer name is required');
      return false;
    }
    if (!trainerForm.type) {
      setFormError('Trainer type is required');
      return false;
    }
    if (!trainerForm.phone.trim()) {
      setFormError('Phone number is required');
      return false;
    }
    if (!trainerForm.rate || isNaN(trainerForm.rate) || parseInt(trainerForm.rate, 10) < 0) {
      setFormError('Valid rate is required');
      return false;
    }
    return true;
  };

  const validateSessionForm = () => {
    if (!sessionForm.type) {
      setFormError('Session type is required');
      return false;
    }
    if (!sessionForm.time.trim()) {
      setFormError('Session time is required');
      return false;
    }
    if (!sessionForm.duration || isNaN(sessionForm.duration) || parseInt(sessionForm.duration) < 15) {
      setFormError('Duration must be at least 15 minutes');
      return false;
    }
    if (!sessionForm.rate || isNaN(sessionForm.rate) || parseInt(sessionForm.rate, 10) < 0) {
      setFormError('Valid rate is required');
      return false;
    }
    return true;
  };

  const handleCreateSubmit = async () => {
    try {
      setFormError('');

      if (modalTab === 'trainer') {
        if (!validateTrainerForm()) return;

        setSubmitting(true);
        const token = localStorage.getItem('adminToken');
        
        const formData = new FormData();
        formData.append('name', trainerForm.name);
        formData.append('type', trainerForm.type);
        formData.append('experience', trainerForm.experience || 0);
        formData.append('phone', trainerForm.phone);
        formData.append('rate', parseInt(trainerForm.rate, 10));
        
        formData.append('instagram', trainerForm.socialMedia.instagram);
        formData.append('facebook', trainerForm.socialMedia.facebook);
        formData.append('x', trainerForm.socialMedia.x);
        
        if (trainerForm.certification) {
          formData.append('certification', trainerForm.certification);
        }

        const response = await fetch('http://localhost:5000/api/trainer/admin/create', {
          method: 'POST',
          headers: {
            'Authorization': token
          },
          body: formData
        });

        const data = await response.json();

        if (data.success) {
          alert('Trainer created successfully!');
          fetchTrainersAndSessions();
          handleCreateCancel();
        } else {
          setFormError(data.message || 'Failed to create trainer');
        }
      } else {
        if (!validateSessionForm()) return;

        setSubmitting(true);
        const token = localStorage.getItem('adminToken');

        const response = await fetch('http://localhost:5000/api/session/admin/create', {
          method: 'POST',
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: sessionForm.type,
            time: sessionForm.time,
            duration: parseInt(sessionForm.duration),
            rate: parseInt(sessionForm.rate, 10),
            maxCapacity: sessionForm.maxCapacity ? parseInt(sessionForm.maxCapacity) : 1,
            dayOfWeek: sessionForm.dayOfWeek || undefined,
            phone: sessionForm.phone || ''
          })
        });

        const data = await response.json();

        if (data.success) {
          alert('Workout session created successfully!');
          fetchTrainersAndSessions();
          handleCreateCancel();
        } else {
          setFormError(data.message || 'Failed to create session');
        }
      }
    } catch (err) {
      console.error('Create error:', err);
      setFormError('Failed to create. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (type, item) => {
    setDeleteModal({
      show: true,
      type: type,
      id: item._id,
      name: type === 'trainer' ? item.name : `${item.type} - ${item.time}`
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleteSubmitting(true);
      const token = localStorage.getItem('adminToken');
      const endpoint = deleteModal.type === 'trainer' ? 'trainer' : 'session';

      const response = await fetch(`http://localhost:5000/api/${endpoint}/admin/${deleteModal.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token
        }
      });

      const data = await response.json();

      if (data.success) {
        alert(`${deleteModal.type === 'trainer' ? 'Trainer' : 'Session'} deleted successfully!`);
        fetchTrainersAndSessions();
        setDeleteModal({ show: false, type: null, id: null, name: '' });
      } else {
        alert(data.message || 'Failed to delete');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete. Please try again.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ show: false, type: null, id: null, name: '' });
  };

  const handleEditClick = (type, item) => {
    if (type === 'trainer') {
      setEditModal({
        show: true,
        type: 'trainer',
        id: item._id,
        data: item
      });
      setTrainerForm({
        name: item.name || '',
        type: item.type || '',
        experience: item.experience || '',
        certification: null,
        phone: item.phone || '',
        socialMedia: {
          instagram: item.instagram || '',
          facebook: item.facebook || '',
          x: item.x || ''
        },
        rate: item.rate || '',
        isActive: item.isActive !== undefined ? item.isActive : true
      });
    } else {
      setEditModal({
        show: true,
        type: 'session',
        id: item._id,
        data: item
      });
      setSessionForm({
        type: item.type || '',
        time: item.time || '',
        duration: item.duration || '',
        rate: item.rate || '',
        maxCapacity: item.maxCapacity || '',
        dayOfWeek: item.dayOfWeek || '',
        phone: item.phone || '',
        isActive: item.isActive !== undefined ? item.isActive : true
      });
    }
    setEditError('');
  };

  const handleEditCancel = () => {
    setEditModal({ show: false, type: null, id: null, data: null });
    setEditError('');
  };

  const handleEditSubmit = async () => {
    try {
      setEditError('');
      setEditSubmitting(true);
      const token = localStorage.getItem('adminToken');

      if (editModal.type === 'trainer') {
        if (!validateTrainerForm()) return;

        const formData = new FormData();
        formData.append('name', trainerForm.name);
        formData.append('type', trainerForm.type);
        formData.append('experience', trainerForm.experience || 0);
        formData.append('phone', trainerForm.phone);
        formData.append('rate', parseInt(trainerForm.rate, 10));
        formData.append('instagram', trainerForm.socialMedia.instagram);
        formData.append('facebook', trainerForm.socialMedia.facebook);
        formData.append('x', trainerForm.socialMedia.x);
        formData.append('isActive', trainerForm.isActive);
        
        if (trainerForm.certification) {
          formData.append('certification', trainerForm.certification);
        }

        const response = await fetch(`http://localhost:5000/api/trainer/admin/${editModal.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': token
          },
          body: formData
        });

        const data = await response.json();

        if (data.success) {
          alert('Trainer updated successfully!');
          fetchTrainersAndSessions();
          handleEditCancel();
        } else {
          setEditError(data.message || 'Failed to update trainer');
        }
      } else {
        if (!validateSessionForm()) return;

        const response = await fetch(`http://localhost:5000/api/session/admin/${editModal.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: sessionForm.type,
            time: sessionForm.time,
            duration: parseInt(sessionForm.duration),
            rate: parseInt(sessionForm.rate, 10),
            maxCapacity: sessionForm.maxCapacity ? parseInt(sessionForm.maxCapacity) : 1,
            dayOfWeek: sessionForm.dayOfWeek || undefined,
            phone: sessionForm.phone || '',
            isActive: sessionForm.isActive
          })
        });

        const data = await response.json();

        if (data.success) {
          alert('Workout session updated successfully!');
          fetchTrainersAndSessions();
          handleEditCancel();
        } else {
          setEditError(data.message || 'Failed to update session');
        }
      }
    } catch (err) {
      console.error('Edit error:', err);
      setEditError('Failed to update. Please try again.');
    } finally {
      setEditSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="trainer-management">
        <h1>Trainer & Session Management</h1>
        <div className="trainer-management-content">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="trainer-management">
      <h1>Trainer & Session Management</h1>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="trainer-management-content">
        {/* Trainers Section */}
        <div className="section">
          <div className="section-header">
            <h2>Trainers</h2>
            <button className="btn-create" onClick={handleCreateClick} title="Create new trainer or session">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Create
            </button>
          </div>

          {trainers.length > 0 ? (
            <div className="table-container">
              <table className="trainers-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Years of Experience</th>
                    <th>Phone</th>
                    <th>Rate (Rs.)</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trainers.map(trainer => (
                    <tr key={trainer._id}>
                      <td className="trainer-name">{trainer.name}</td>
                      <td>{trainer.type}</td>
                      <td>{trainer.experience || '-'}</td>
                      <td>{trainer.phone}</td>
                      <td>Rs. {trainer.rate.toLocaleString('en-PK')}</td>
                      <td>
                        <span className={`status-badge status-${trainer.isActive ? 'active' : 'inactive'}`}>
                          {trainer.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="edit-btn" onClick={() => handleEditClick('trainer', trainer)} title="Edit">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                          <button className="delete-btn" onClick={() => handleDeleteClick('trainer', trainer)} title="Delete">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-data">
              <p>No trainers yet. Click the Create button to add one.</p>
            </div>
          )}
        </div>

        {/* Sessions Section */}
        <div className="section">
          <div className="section-header">
            <h2>Workout Sessions</h2>
          </div>

          {sessions.length > 0 ? (
            <div className="table-container">
              <table className="sessions-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Time</th>
                    <th>Duration (min)</th>
                    <th>Rate (Rs.)</th>
                    <th>Max Capacity</th>
                    <th>Bookings</th>
                    <th>Day</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(session => (
                    <tr key={session._id}>
                      <td>{session.type}</td>
                      <td>{session.time}</td>
                      <td>{session.duration}</td>
                      <td>Rs. {session.rate.toLocaleString('en-PK')}</td>
                      <td>{session.maxCapacity}</td>
                      <td>
                        <span className="bookings-badge">
                          {session.bookingCount || 0} / {session.maxCapacity}
                        </span>
                      </td>
                      <td>{session.dayOfWeek || '-'}</td>
                      <td>
                        <span className={`status-badge status-${session.isFull ? 'full' : (session.isActive ? 'active' : 'inactive')}`}>
                          {session.isFull ? 'Full' : (session.isActive ? 'Active' : 'Inactive')}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="edit-btn" onClick={() => handleEditClick('session', session)} title="Edit">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                          <button className="delete-btn" onClick={() => handleDeleteClick('session', session)} title="Delete">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-data">
              <p>No sessions yet. Click the Create button to add one.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {createModal.show && (
        <div className="modal-overlay">
          <div className="modal-content create-modal">
            <div className="trainer-management-modal-header">
              <h2>Create New Entry</h2>
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

            <div className="modal-tabs">
              <button 
                className={`tab-button ${modalTab === 'trainer' ? 'active' : ''}`}
                onClick={() => handleModalTabChange('trainer')}
              >
                Trainer
              </button>
              <button 
                className={`tab-button ${modalTab === 'session' ? 'active' : ''}`}
                onClick={() => handleModalTabChange('session')}
              >
                Session
              </button>
            </div>

            <div className="modal-body">
              {formError && (
                <div className="form-error">
                  {formError}
                </div>
              )}

              {modalTab === 'trainer' ? (
                <div className="form-section">
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter trainer name"
                      name="name"
                      value={trainerForm.name}
                      onChange={handleTrainerFormChange}
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label>Type *</label>
                    <select
                      className="form-input"
                      name="type"
                      value={trainerForm.type}
                      onChange={handleTrainerFormChange}
                      disabled={submitting}
                    >
                      <option value="">Select trainer type</option>
                      {TRAINER_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label>Years of Experience</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="e.g., 5"
                        name="experience"
                        value={trainerForm.experience}
                        onChange={handleTrainerFormChange}
                        disabled={submitting}
                        min="0"
                      />
                    </div>

                    <div className="form-group flex-1">
                      <label>Phone Number *</label>
                      <input
                        type="tel"
                        className="form-input"
                        placeholder="e.g., 03001234567"
                        name="phone"
                        value={trainerForm.phone}
                        onChange={handleTrainerFormChange}
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Rate per Session (Rs.) *</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g., 2000"
                      name="rate"
                      value={trainerForm.rate}
                      onChange={handleTrainerFormChange}
                      disabled={submitting}
                      min="0"
                      step="1"
                    />
                  </div>

                  <div className="form-group">
                    <label>Certification (Image/PDF)</label>
                    <input
                      type="file"
                      className="form-input"
                      name="certification"
                      onChange={handleCertificationChange}
                      disabled={submitting}
                      accept="image/*,.pdf"
                    />
                    <p className="form-hint">Accepted: JPG, PNG, GIF, PDF (Max 5MB)</p>
                  </div>

                  <div className="form-section-title">Social Media Links</div>

                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label>Instagram</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Instagram username or profile URL"
                        name="socialMedia_instagram"
                        value={trainerForm.socialMedia.instagram}
                        onChange={handleTrainerFormChange}
                        disabled={submitting}
                      />
                    </div>

                    <div className="form-group flex-1">
                      <label>Facebook</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Facebook profile URL"
                        name="socialMedia_facebook"
                        value={trainerForm.socialMedia.facebook}
                        onChange={handleTrainerFormChange}
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>X</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="X profile URL"
                      name="socialMedia_x"
                      value={trainerForm.socialMedia.x}
                      onChange={handleTrainerFormChange}
                      disabled={submitting}
                    />
                  </div>

                </div>
              ) : (
                <div className="form-section">
                  <div className="form-group">
                    <label>Session Type *</label>
                    <select
                      className="form-input"
                      name="type"
                      value={sessionForm.type}
                      onChange={handleSessionFormChange}
                      disabled={submitting}
                    >
                      <option value="">Select session type</option>
                      {SESSION_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label>Time *</label>
                      <input
                        type="time"
                        className="form-input"
                        name="time"
                        value={sessionForm.time}
                        onChange={handleSessionFormChange}
                        disabled={submitting}
                      />
                    </div>

                    <div className="form-group flex-1">
                      <label>Duration (Minutes) *</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="e.g., 60"
                        name="duration"
                        value={sessionForm.duration}
                        onChange={handleSessionFormChange}
                        disabled={submitting}
                        min="15"
                        step="5"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label>Rate (Rs.) *</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="e.g., 1500"
                        name="rate"
                        value={sessionForm.rate}
                        onChange={handleSessionFormChange}
                        disabled={submitting}
                        min="0"
                        step="1"
                      />
                    </div>

                    <div className="form-group flex-1">
                      <label>Max Capacity</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="e.g., 10"
                        name="maxCapacity"
                        value={sessionForm.maxCapacity}
                        onChange={handleSessionFormChange}
                        disabled={submitting}
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Day of Week</label>
                    <select
                      className="form-input"
                      name="dayOfWeek"
                      value={sessionForm.dayOfWeek}
                      onChange={handleSessionFormChange}
                      disabled={submitting}
                    >
                      <option value="">Select day (optional)</option>
                      {DAYS_OF_WEEK.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="e.g., 9876543210"
                      name="phone"
                      value={sessionForm.phone}
                      onChange={handleSessionFormChange}
                      disabled={submitting}
                    />
                  </div>

                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="btn-cancel" 
                onClick={handleCreateCancel}
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                className="btn-submit" 
                onClick={handleCreateSubmit}
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.show && (
        <div className="modal-overlay">
          <div className="modal-content create-modal">
            <div className="trainer-management-modal-header">
              <h2>Edit {editModal.type === 'trainer' ? 'Trainer' : 'Session'}</h2>
              <button 
                className="modal-close-btn"
                onClick={handleEditCancel}
                disabled={editSubmitting}
                title="Close"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              {editError && (
                <div className="form-error">
                  {editError}
                </div>
              )}

              {editModal.type === 'trainer' ? (
                <div className="form-section">
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter trainer name"
                      name="name"
                      value={trainerForm.name}
                      onChange={handleTrainerFormChange}
                      disabled={editSubmitting}
                    />
                  </div>

                  <div className="form-group">
                    <label>Type *</label>
                    <select
                      className="form-input"
                      name="type"
                      value={trainerForm.type}
                      onChange={handleTrainerFormChange}
                      disabled={editSubmitting}
                    >
                      <option value="">Select trainer type</option>
                      {TRAINER_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label>Years of Experience</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="e.g., 5"
                        name="experience"
                        value={trainerForm.experience}
                        onChange={handleTrainerFormChange}
                        disabled={editSubmitting}
                        min="0"
                      />
                    </div>

                    <div className="form-group flex-1">
                      <label>Phone Number *</label>
                      <input
                        type="tel"
                        className="form-input"
                        placeholder="e.g., 03001234567"
                        name="phone"
                        value={trainerForm.phone}
                        onChange={handleTrainerFormChange}
                        disabled={editSubmitting}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Rate per Session (Rs.) *</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g., 2000"
                      name="rate"
                      value={trainerForm.rate}
                      onChange={handleTrainerFormChange}
                      disabled={editSubmitting}
                      min="0"
                      step="1"
                    />
                  </div>

                  <div className="form-group">
                    <label style={{marginBottom: '12px'}}>Status</label>
                    <div className="status-toggle-group">
                      <label className="status-radio">
                        <input
                          type="radio"
                          name="isActive"
                          value="true"
                          checked={trainerForm.isActive === true}
                          onChange={() => setTrainerForm(prev => ({ ...prev, isActive: true }))}
                          disabled={editSubmitting}
                        />
                        <span className="radio-label">Active</span>
                      </label>
                      <label className="status-radio">
                        <input
                          type="radio"
                          name="isActive"
                          value="false"
                          checked={trainerForm.isActive === false}
                          onChange={() => setTrainerForm(prev => ({ ...prev, isActive: false }))}
                          disabled={editSubmitting}
                        />
                        <span className="radio-label">Inactive</span>
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Certification (Image/PDF)</label>
                    <input
                      type="file"
                      className="form-input"
                      name="certification"
                      onChange={handleCertificationChange}
                      disabled={editSubmitting}
                      accept="image/*,.pdf"
                    />
                    <p className="form-hint">Accepted: JPG, PNG, GIF, PDF (Max 5MB)</p>
                  </div>

                  <div className="form-section-title">Social Media Links</div>

                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label>Instagram</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Instagram username or profile URL"
                        name="socialMedia_instagram"
                        value={trainerForm.socialMedia.instagram}
                        onChange={handleTrainerFormChange}
                        disabled={editSubmitting}
                      />
                    </div>

                    <div className="form-group flex-1">
                      <label>Facebook</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Facebook profile URL"
                        name="socialMedia_facebook"
                        value={trainerForm.socialMedia.facebook}
                        onChange={handleTrainerFormChange}
                        disabled={editSubmitting}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>X</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="X profile URL"
                      name="socialMedia_x"
                      value={trainerForm.socialMedia.x}
                      onChange={handleTrainerFormChange}
                      disabled={editSubmitting}
                    />
                  </div>

                </div>
              ) : (
                <div className="form-section">
                  <div className="form-group">
                    <label>Session Type *</label>
                    <select
                      className="form-input"
                      name="type"
                      value={sessionForm.type}
                      onChange={handleSessionFormChange}
                      disabled={editSubmitting}
                    >
                      <option value="">Select session type</option>
                      {SESSION_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label>Time *</label>
                      <input
                        type="time"
                        className="form-input"
                        name="time"
                        value={sessionForm.time}
                        onChange={handleSessionFormChange}
                        disabled={editSubmitting}
                      />
                    </div>

                    <div className="form-group flex-1">
                      <label>Duration (Minutes) *</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="e.g., 60"
                        name="duration"
                        value={sessionForm.duration}
                        onChange={handleSessionFormChange}
                        disabled={editSubmitting}
                        min="15"
                        step="5"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label>Rate (Rs.) *</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="e.g., 1500"
                        name="rate"
                        value={sessionForm.rate}
                        onChange={handleSessionFormChange}
                        disabled={editSubmitting}
                        min="0"
                        step="1"
                      />
                    </div>

                    <div className="form-group flex-1">
                      <label>Max Capacity</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="e.g., 10"
                        name="maxCapacity"
                        value={sessionForm.maxCapacity}
                        onChange={handleSessionFormChange}
                        disabled={editSubmitting}
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Day of Week</label>
                    <select
                      className="form-input"
                      name="dayOfWeek"
                      value={sessionForm.dayOfWeek}
                      onChange={handleSessionFormChange}
                      disabled={editSubmitting}
                    >
                      <option value="">Select day (optional)</option>
                      {DAYS_OF_WEEK.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="e.g., 9876543210"
                      name="phone"
                      value={sessionForm.phone}
                      onChange={handleSessionFormChange}
                      disabled={editSubmitting}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{marginBottom: '12px'}}>Status</label>
                    <div className="status-toggle-group">
                      <label className="status-radio">
                        <input
                          type="radio"
                          name="isActive"
                          value="true"
                          checked={sessionForm.isActive === true}
                          onChange={() => setSessionForm(prev => ({ ...prev, isActive: true }))}
                          disabled={editSubmitting}
                        />
                        <span className="radio-label">Active</span>
                      </label>
                      <label className="status-radio">
                        <input
                          type="radio"
                          name="isActive"
                          value="false"
                          checked={sessionForm.isActive === false}
                          onChange={() => setSessionForm(prev => ({ ...prev, isActive: false }))}
                          disabled={editSubmitting}
                        />
                        <span className="radio-label">Inactive</span>
                      </label>
                    </div>
                  </div>

                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="btn-cancel" 
                onClick={handleEditCancel}
                disabled={editSubmitting}
              >
                Cancel
              </button>
              <button 
                className="btn-submit" 
                onClick={handleEditSubmit}
                disabled={editSubmitting}
              >
                {editSubmitting ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.show && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="trainer-management-modal-header">
              <h2>Confirm Delete</h2>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete the {deleteModal.type} <strong>{deleteModal.name}</strong>?</p>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-cancel" 
                onClick={handleDeleteCancel}
                disabled={deleteSubmitting}
              >
                No, Cancel
              </button>
              <button 
                className="btn-confirm" 
                onClick={handleDeleteConfirm}
                disabled={deleteSubmitting}
              >
                {deleteSubmitting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerManagement;
