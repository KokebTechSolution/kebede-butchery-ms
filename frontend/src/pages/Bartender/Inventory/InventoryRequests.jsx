import React, { useEffect, useState } from 'react';
import {
  fetchRequests,
  fetchProductMeasurements,
  cancelRequest,
  updateRequest,
  ReachRequest,
} from '../../../api/inventory';
import api from '../../../api/axiosInstance';
import NewRequest from './NewRequest';
import BarmanStockStatus from './BarmanStockStatus';
import { useAuth } from '../../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { FaBox, FaEdit, FaTimes, FaCheck, FaCheckCircle, FaClock, FaUser, FaPlus } from 'react-icons/fa';

const InventoryRequestList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [tab, setTab] = useState('available');
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [formData, setFormData] = useState({
    product: '',
    quantity: '',
    status: 'pending',
    branch: '',
  });
  const [formMessage, setFormMessage] = useState('');
  const [defaultMeasurement, setDefaultMeasurement] = useState(null);

  const { user } = useAuth();
  const branchId = user?.branch;
  const bartenderId = user?.id;
  const isManager = user?.role === 'manager';
  const isBartender = user?.role === 'bartender';

  // Refresh stocks trigger
  const [refreshStockTrigger, setRefreshStockTrigger] = useState(0);

  useEffect(() => {
    loadRequests();
    loadProducts();
    loadBranches();
  }, []);

  useEffect(() => {
    fetchBarmanStocks();
  }, [refreshStockTrigger]);

  useEffect(() => {
    if (formData.product) {
      fetchProductMeasurements(formData.product)
        .then((measurements) => {
          const def = measurements.find(m => m.is_default_sales_unit) || null;
          setDefaultMeasurement(def);
        })
        .catch(() => setDefaultMeasurement(null));
    } else {
      setDefaultMeasurement(null);
    }
  }, [formData.product]);

  const fetchBarmanStocks = async () => {
    try {
      const res = await api.get('/inventory/barman-stock/');
      setStocks(res.data);
    } catch (err) {
      console.error('Error fetching barman stocks:', err);
    }
  };

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await fetchRequests();
      setRequests(data);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      alert('Error loading requests');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await api.get('/inventory/products/');
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const loadBranches = async () => {
    try {
      const res = await api.get('/inventory/branches/');
      setBranches(res.data);
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    }
  };

  const handleAccept = async (id) => {
    setProcessingId(id);
    try {
      await api.post(`/inventory/requests/${id}/accept/`);
      await loadRequests();
      setFormMessage('Request accepted!');
    } catch (err) {
      setFormMessage('Failed to accept request.');
    } finally {
      setProcessingId(null);
    }
  };



  const handleCancelRequest = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this request?')) return;

    setProcessingId(id);
    try {
      await cancelRequest(id);
      await loadRequests();
      setFormMessage('Request canceled!');
    } catch (err) {
      setFormMessage('Failed to cancel request.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleEditRequest = async (id, updatedData) => {
    setProcessingId(id);
    try {
      await updateRequest(id, updatedData);
      await loadRequests();
      setFormMessage('Request updated!');
    } catch (err) {
      setFormMessage('Failed to update request.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReach = async (id) => {
    setProcessingId(id);
    try {
      await ReachRequest(id);
      await loadRequests();
      setFormMessage('Request marked as reached!');
    } catch (err) {
      setFormMessage('Failed to mark request as reached.');
    } finally {
      setProcessingId(null);
    }
  };

  // Filter requests by branch
  const filteredRequests = requests.filter(
    req => String(req.branch_id || req.branch?.id) === String(branchId)
  );

  const { t } = useTranslation();

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="p-4 space-y-4">
      <BarmanStockStatus stocks={stocks} tab={tab} setTab={setTab} bartenderId={bartenderId} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <FaBox className="text-purple-600 text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('inventory_requests')}</h1>
            <p className="text-sm text-gray-500">Manage inventory requests and stock</p>
          </div>
        </div>
        
        {isBartender && (
          <button
            className="bg-purple-600 text-white px-4 py-3 rounded-xl hover:bg-purple-700 transition-colors shadow-sm flex items-center space-x-2"
            onClick={() => {
              setFormMessage('');
              setShowModal(true);
            }}
          >
            <FaPlus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('new_request')}</span>
          </button>
        )}
      </div>

      <NewRequest
        showModal={showModal}
        setShowModal={setShowModal}
        formData={formData}
        formMessage={formMessage}
        products={products}
        branches={branches}
        handleFormChange={(e) => {
          const { name, value } = e.target;
          setFormData(prev => ({ ...prev, [name]: value }));
        }}
        handleFormSubmit={async (e) => {
          e.preventDefault();
          if (!formData.product || !formData.branch || !formData.quantity || Number(formData.quantity) <= 0) {
            setFormMessage('Please select a product, branch, and enter a valid quantity.');
            return;
          }
          const unitId = defaultMeasurement?.from_unit_id || defaultMeasurement?.from_unit_id_read;
          if (!defaultMeasurement || typeof unitId !== 'number' || unitId <= 0) {
            setFormMessage('No default sales unit defined for this product.');
            return;
          }
          try {
            await api.post('/inventory/requests/', {
              product_id: parseInt(formData.product),
              quantity: formData.quantity,
              branch_id: parseInt(formData.branch),
              status: 'pending',
              request_unit_id: unitId,
            });
            setFormMessage('Request submitted successfully!');
            setFormData({
              product: '',
              quantity: '',
              status: 'pending',
              branch: formData.branch,
            });
            setShowModal(false);
            await loadRequests();
          } catch (err) {
            const errors = err.response?.data || {};
            const messages = [];
            for (const key in errors) {
              if (Array.isArray(errors[key])) {
                messages.push(`${key}: ${errors[key].join(', ')}`);
              } else if (typeof errors[key] === 'object') {
                messages.push(`${key}: ${Object.values(errors[key]).flat().join(', ')}`);
              } else {
                messages.push(`${key}: ${errors[key]}`);
              }
            }
            if (messages.length === 0 && err.message) messages.push(err.message);
            setFormMessage(messages.join(' | ') || 'Submission failed.');
          }
        }}
        defaultMeasurement={defaultMeasurement}
      />

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 px-4">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaBox className="text-gray-400 text-3xl" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
          <p className="text-gray-500">{t('no_requests_found_for_branch')}</p>
        </div>
      ) : (
        /* Mobile-Friendly Request Cards */
        <div className="space-y-4">
          {filteredRequests.map(req => {
            const reached = Boolean(req.reached_status);
            const canEditOrCancel = isBartender && req.status === 'pending' && req.requested_by === bartenderId;
            
            return (
              <div key={`${req.id}-${reached ? 'r' : 'nr'}`} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Request Header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg mb-1">
                        {req.product?.name || 'N/A'}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <FaUser className="w-3 h-3" />
                          <span>{req.branch?.name || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FaClock className="w-3 h-3" />
                          <span>{new Date(req.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(req.status)}`}>
                      {req.status}
                    </span>
                  </div>
                  
                  {/* Product Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <div className="text-gray-500">Category</div>
                      <div className="font-medium">{req.product?.category?.category_name || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Type</div>
                      <div className="font-medium">{req.product?.category?.item_type?.type_name || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Quantity</div>
                      <div className="font-medium">{req.quantity} {req.request_unit?.unit_name || ''}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Basic Unit</div>
                      <div className="font-medium">{req.quantity_basic_unit ?? 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 bg-gray-50">
                  <div className="flex flex-wrap gap-2">
                    {/* Bartender: can edit or cancel only pending requests they made */}
                    {canEditOrCancel && (
                      <>
                        <button
                          onClick={() => {
                            const updatedQty = prompt('Enter new quantity:', req.quantity);
                            if (updatedQty && !isNaN(updatedQty) && Number(updatedQty) > 0) {
                              handleEditRequest(req.id, { quantity: Number(updatedQty) });
                            }
                          }}
                          disabled={processingId === req.id}
                          className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-colors"
                        >
                          <FaEdit className="w-4 h-4" />
                          <span>{t('edit')}</span>
                        </button>
                        <button
                          onClick={() => handleCancelRequest(req.id)}
                          disabled={processingId === req.id}
                          className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                        >
                          <FaTimes className="w-4 h-4" />
                          <span>{t('cancel')}</span>
                        </button>
                      </>
                    )}

                    {/* Manager: Accept pending requests */}
                    {isManager && req.status === 'pending' && (
                      <button
                        onClick={() => handleAccept(req.id)}
                        disabled={processingId === req.id}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                      >
                        <FaCheck className="w-4 h-4" />
                        <span>{t('accept')}</span>
                      </button>
                    )}

                    {/* Bartender: Mark accepted requests as reached */}
                    {isBartender && req.status === 'accepted' && !req.reached_status && (
                      <button
                        onClick={() => handleReach(req.id)}
                        disabled={processingId === req.id}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                      >
                        <FaCheckCircle className="w-4 h-4" />
                        <span>{t('reached') || 'Reached'}</span>
                      </button>
                    )}

                    {/* Status indicators for non-pending requests */}
                    {req.status === 'fulfilled' && (
                      <span className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
                        <FaCheckCircle className="w-4 h-4" />
                        <span>{t('fulfilled')}</span>
                      </span>
                    )}
                    
                    {req.status === 'accepted' && !req.reached_status && (
                      <span className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium">
                        <FaClock className="w-4 h-4" />
                        <span>{t('accepted')}</span>
                      </span>
                    )}
                    
                    {req.status === 'accepted' && req.reached_status && (
                      <span className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
                        <FaCheckCircle className="w-4 h-4" />
                        <span>{t('reached') || 'Reached'}</span>
                      </span>
                    )}
                    
                    {req.status === 'rejected' && (
                      <span className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-800 rounded-lg font-medium">
                        <FaTimes className="w-4 h-4" />
                        <span>{t('rejected')}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InventoryRequestList;