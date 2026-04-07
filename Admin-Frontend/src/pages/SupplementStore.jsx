import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import './SupplementStore.css';
import { API_URL } from '../utils/api';

const categories = [
  'Whey Protein',
  'Creatine',
  'Pre-Workout',
  'Plant Protein',
  'Multivitamin',
  'Fish Oil',
  'BCAA',
  'Other',
];

const emptyProduct = () => ({
  _id: '',
  name: '',
  description: '',
  price: 0,
  category: 'Whey Protein',
  stock: 0,
  images: [],
});

const formatRs = (v) => `Rs ${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const statusColors = {
  Unfulfilled: 'status-unfulfilled',
  'In Progress': 'status-in-progress',
  Fulfilled: 'status-fulfilled',
};

const SupplementStore = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProduct());
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState('');
  const [pendingStatusByOrder, setPendingStatusByOrder] = useState({});
  const [uploadingImages, setUploadingImages] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});
  const [productPage, setProductPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const pageSize = 5;
  const deleteModalRef = useRef(null);
  const productModalRef = useRef(null);

  const adminHeaders = useMemo(() => {
    const token = localStorage.getItem('adminToken');
    return token ? { Authorization: token, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [prodRes, orderRes] = await Promise.all([
        fetch(`${API_URL}/api/products`),
        fetch(`${API_URL}/api/orders/admin/all`, { headers: adminHeaders }),
      ]);
      const prodData = await prodRes.json();
      const orderData = await orderRes.json();
      if (!prodData.success) throw new Error(prodData.message || 'Failed to load products');
      if (!orderData.success) throw new Error(orderData.message || 'Failed to load orders');
      setProducts(prodData.products || []);
      setOrders(orderData.orders || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load store data');
    } finally {
      setLoading(false);
    }
  }, [adminHeaders]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const handleModalClickOutside = (event) => {
      if (deleteModalRef.current && !deleteModalRef.current.contains(event.target)) {
        setDeleteTarget(null);
      }
    };

    if (deleteTarget) {
      document.addEventListener('mousedown', handleModalClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleModalClickOutside);
    };
  }, [deleteTarget]);

  useEffect(() => {
    const handleModalClickOutside = (event) => {
      if (productModalRef.current && !productModalRef.current.contains(event.target)) {
        setShowProductModal(false);
      }
    };

    if (showProductModal) {
      document.addEventListener('mousedown', handleModalClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleModalClickOutside);
    };
  }, [showProductModal]);

  useEffect(() => {
    setProductPage(1);
  }, [products]);

  useEffect(() => {
    setOrderPage(1);
  }, [orders]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyProduct());
    setShowProductModal(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({ ...product, images: [...product.images] });
    setShowProductModal(true);
  };

  const saveProduct = async () => {
    if (!form.name || !form.price || !form.images?.length) {
      alert('Name, price and at least one image are required');
      return;
    }
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `${API_URL}/api/products/${editing._id}` : `${API_URL}/api/products`;
    const res = await fetch(url, {
      method,
      headers: adminHeaders,
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.success) {
      if (editing) {
        setProducts((prev) => prev.map((p) => (p._id === editing._id ? data.product : p)));
      } else {
        setProducts((prev) => [data.product, ...prev]);
      }
      setShowProductModal(false);
      setEditing(null);
      setForm(emptyProduct());
    } else {
      alert(data.message || 'Failed to save product');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`${API_URL}/api/products/${deleteTarget._id}`, {
      method: 'DELETE',
      headers: adminHeaders,
    });
    const data = await res.json();
    if (data.success) {
      setProducts((prev) => prev.filter((p) => p._id !== deleteTarget._id));
      setDeleteTarget(null);
    } else {
      alert(data.message || 'Failed to delete product');
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      setStatusUpdating(orderId);
      setPendingStatusByOrder((prev) => ({ ...prev, [orderId]: status }));
      const res = await fetch(`${API_URL}/api/orders/admin/${orderId}/status`, {
        method: 'PUT',
        headers: adminHeaders,
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.map((o) => (o._id === orderId ? data.order : o)));
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch (err) {
      alert(err.message || 'Failed to update status');
    } finally {
      setPendingStatusByOrder((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
      setStatusUpdating('');
    }
  };

  const handleImageUpload = async (event, index) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const uploadId = `${Date.now()}-${index}`;
    setUploadingImages((prev) => ({ ...prev, [uploadId]: true }));
    setUploadErrors((prev) => ({ ...prev, [uploadId]: null }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_URL}/api/products/upload`, {
        method: 'POST',
        headers: { Authorization: localStorage.getItem('adminToken') || '' },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        const next = [...form.images];
        next[index] = data.url;
        setForm({ ...form, images: next });
        setUploadErrors((prev) => {
          const newState = { ...prev };
          delete newState[uploadId];
          return newState;
        });
      } else {
        setUploadErrors((prev) => ({ ...prev, [uploadId]: data.message || 'Upload failed' }));
      }
    } catch (err) {
      setUploadErrors((prev) => ({
        ...prev,
        [uploadId]: err.message || 'Failed to upload image',
      }));
    } finally {
      setUploadingImages((prev) => {
        const newState = { ...prev };
        delete newState[uploadId];
        return newState;
      });
    }
  };

  return (
    <div className="supplement-store">
      <div className="header-section">
        <div className="header-info" style={{width:'100%'}}>
          <h1 style={{width:'100%'}}>Supplement Store</h1>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loading-spinner"></div>
          <p style={{ color: '#666', marginTop: '16px' }}>Loading store data...</p>
        </div>
      )}

      <div className="supplement-store-content">
        {/* Products Section */}
        <section>
          <div className="header-section">
            <div className="header-info" style={{ flexDirection: 'row', justifyContent: 'space-between', width:'100%' }}>
              <h2>Products</h2>
              <button style={{marginBottom:'20px'}} className="btn-create" onClick={openCreate}>
              + Create Product
            </button>
            </div>
            
          </div>

          <div className="table-container">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length > 0 ? (
                  products
                    .slice((productPage - 1) * pageSize, productPage * pageSize)
                    .map((p) => (
                    <tr key={p._id}>
                      <td>
                        <img 
                          src={p.images?.[0] || 'https://placehold.co/60x60?text=No+Image'} 
                          alt={p.name} 
                          className="product-image" 
                        />
                      </td>
                      <td className="product-name">{p.name}</td>
                      <td>{p.category}</td>
                      <td>{formatRs(p.price)}</td>
                      <td style={{ color: p.stock === 0 ? '#999' : '#333' }}>
                        {p.stock}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="edit-btn" 
                            onClick={() => openEdit(p)}
                            title="Edit product"
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                          <button 
                            className="delete-btn" 
                            onClick={() => setDeleteTarget(p)}
                            title="Delete product"
                          >
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
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">
                      <div className="no-data">
                        <p>No products yet. Create your first product to get started.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {products.length > pageSize && (
              <div className="table-pagination">
                <button
                  className="page-btn"
                  onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                  disabled={productPage === 1}
                >
                  Prev
                </button>
                <span className="page-info">Page {productPage} of {Math.ceil(products.length / pageSize)}</span>
                <button
                  className="page-btn"
                  onClick={() => setProductPage((p) => Math.min(Math.ceil(products.length / pageSize), p + 1))}
                  disabled={productPage >= Math.ceil(products.length / pageSize)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Orders Section */}
        <section>
          <div className="header-section">
            <div className="header-info">
              <h2>Orders</h2>
            </div>
          </div>

          <div className="table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Location</th>
                  <th>Items</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? (
                  orders
                    .slice((orderPage - 1) * pageSize, orderPage * pageSize)
                    .map((o) => {
                    const isUpdating = statusUpdating === o._id;
                    const shownStatus = pendingStatusByOrder[o._id] || o.status;
                    return (
                    <tr key={o._id}>
                      <td>{o.id || o._id?.slice(0, 8)}</td>
                      <td>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>{o.customerName}</div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>{o.phone}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{o.email}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {o.location || o.address || 'N/A'}
                        </div>
                      </td>
                      <td>
                        {o.products?.map((p, idx) => (
                          <div key={idx} style={{ fontSize: '12px', color: '#666' }}>
                            {p.productName} × {p.quantity}
                          </div>
                        ))}
                      </td>
                      <td>{o.paymentMethod}</td>
                      <td>{formatRs((o.orderTotal || 0) + (o.shippingCost || 0))}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                          <span className={`status-badge ${statusColors[shownStatus] || 'status-unfulfilled'}`}>
                            {shownStatus}
                          </span>
                          <select
                            value={shownStatus}
                            onChange={(e) => updateStatus(o._id, e.target.value)}
                            className="status-select"
                            disabled={isUpdating}
                          >
                            <option>Unfulfilled</option>
                            <option>In Progress</option>
                            <option>Fulfilled</option>
                          </select>
                          {isUpdating && (
                            <span style={{ fontSize: '12px', color: '#666', fontWeight: 500 }}>
                              Updating...
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                  })
                ) : (
                  <tr>
                    <td colSpan="7">
                      <div className="no-data">
                        <p>No orders yet. Start selling your products!</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {orders.length > pageSize && (
              <div className="table-pagination">
                <button
                  className="page-btn"
                  onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                  disabled={orderPage === 1}
                >
                  Prev
                </button>
                <span className="page-info">Page {orderPage} of {Math.ceil(orders.length / pageSize)}</span>
                <button
                  className="page-btn"
                  onClick={() => setOrderPage((p) => Math.min(Math.ceil(orders.length / pageSize), p + 1))}
                  disabled={orderPage >= Math.ceil(orders.length / pageSize)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content" ref={deleteModalRef}>
            <div className="modal-header">
              <h2>Confirm Delete</h2>
              <button 
                className="modal-close-btn" 
                onClick={() => setDeleteTarget(null)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{deleteTarget.name}</strong>?</p>
              <p style={{ fontSize: '14px', color: '#666' }}>This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="btn-submit" onClick={confirmDelete}>
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Product Modal */}
      {showProductModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content" ref={productModalRef}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Product' : 'Create Product'}</h2>
              <button 
                className="modal-close-btn" 
                onClick={() => setShowProductModal(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Product Name</label>
                <input 
                  className="form-input" 
                  placeholder="Enter product name"
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea 
                  className="form-input" 
                  placeholder="Enter product description"
                  value={form.description} 
                  onChange={(e) => setForm({ ...form, description: e.target.value })} 
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price (Rs)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="0"
                    value={form.price || ''} 
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} 
                  />
                </div>
                <div className="form-group">
                  <label>Stock Quantity</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="0"
                    value={form.stock || ''} 
                    onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Category</label>
                <select 
                  className="form-input" 
                  value={form.category} 
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Images</label>
                <div className="image-gallery">
                  {form.images.map((img, idx) => (
                    <div key={idx} className="image-upload-item">
                      {img ? (
                        <div className="uploaded-image">
                          <img 
                            src={img} 
                            alt={`Product ${idx + 1}`}
                            className="uploaded-thumbnail"
                            onError={(e) => {
                              e.target.src = 'https://placehold.co/100x100?text=Error';
                            }}
                          />
                          
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginLeft: '12px',marginBottom:0 }}>
                            <input
                              type="radio"
                              name="primary-image"
                              checked={idx === 0}
                              onChange={() => {
                                const newImages = [...form.images];
                                const [selected] = newImages.splice(idx, 1);
                                newImages.unshift(selected);
                                setForm({ ...form, images: newImages });
                              }}
                              style={{ cursor: 'pointer' }}
                              title="Set as primary image"
                            />
                            <span style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>Select as primary image</span>
                          </label>
                          <div className="image-actions">
                            <label className="edit-btn" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', margin:0 }}>
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
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, idx)}
                                disabled={Object.keys(uploadingImages).length > 0}
                                style={{ display: 'none' }}
                              />
                            </label>
                            <button
                              type="button"
                              className="delete-btn"
                              onClick={() => setForm({ ...form, images: form.images.filter((_, i) => i !== idx) })}
                              title="Delete image"
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <svg 
                                width="20" 
                                height="20" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2"
                              >
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                              </svg>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="image-upload-placeholder">
                          <div className="upload-icon">📁</div>
                          <span className="upload-text">Click to upload or drag image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, idx)}
                            disabled={Object.keys(uploadingImages).length > 0}
                            style={{ display: 'none' }}
                          />
                        </label>
                      )}
                      {Object.keys(uploadingImages).some((id) =>
                        id.includes(`-${idx}`)
                      ) && (
                        <div className="upload-progress">
                          <div className="spinner"></div>
                          <span>Uploading...</span>
                        </div>
                      )}
                      {Object.keys(uploadErrors).some((id) => id.includes(`-${idx}`)) && uploadErrors[Object.keys(uploadErrors).find((id) => id.includes(`-${idx}`))] && (
                        <div className="upload-error">
                          {uploadErrors[Object.keys(uploadErrors).find((id) => id.includes(`-${idx}`))]}
                        </div>
                      )}
                    </div>
                  ))}
                  <button 
                    className="add-image-btn" 
                    onClick={() => setForm({ ...form, images: [...form.images, ''] })}
                    type="button"
                    disabled={Object.keys(uploadingImages).length > 0}
                  >
                    + Add Image
                  </button>
                </div>

                {form.images[0] && (
                  <div style={{ marginTop: '20px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '8px' }}>
                      Primary Image Preview
                    </label>
                    <img 
                      src={form.images[0]} 
                      alt="Preview" 
                      className="preview-image" 
                      onError={(e) => {
                        e.target.src = 'https://placehold.co/400x300?text=Invalid+Image';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowProductModal(false)}>
                Cancel
              </button>
              <button className="btn-submit" onClick={saveProduct}>
                {editing ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplementStore;
