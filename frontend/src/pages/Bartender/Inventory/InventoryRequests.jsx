import React, { useEffect, useState } from 'react';
import {
  fetchRequests,
  ReachRequest,
  NotReachRequest,
  fetchProductMeasurements,
  cancelRequest,
  updateRequest,
} from '../../../api/inventory';
import api from '../../../api/axiosInstance';
import NewRequest from './NewRequest';
import BarmanStockStatus from './BarmanStockStatus';
import { useAuth } from '../../../context/AuthContext';
import { useTranslation } from 'react-i18next';

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
  const isManager = user?.role === 'manager'; // adjust role key as per your auth system
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

  const handleReach = async (id) => {
    setProcessingId(id);
    try {
      await api.post(`/inventory/requests/${id}/reach/`);
      await loadRequests();
      setFormMessage('Marked as reached!');
    } catch (err) {
      setFormMessage('Failed to mark as reached.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleNotReach = async (id) => {
    setProcessingId(id);
    try {
      await api.post(`/inventory/requests/${id}/not-reach/`);
      await loadRequests();
      setFormMessage('Marked as not reached!');
    } catch (err) {
      setFormMessage('Failed to mark as not reached.');
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

  // Filter requests by branch
  const filteredRequests = requests.filter(
    req => String(req.branch_id || req.branch?.id) === String(branchId)
  );

  const { t } = useTranslation();

  return (
    <div className="p-4">
      <BarmanStockStatus stocks={stocks} tab={tab} setTab={setTab} bartenderId={bartenderId} />

      {/* Mobile Summary Cards */}
      <div className="block md:hidden mb-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{filteredRequests.length}</div>
            <div className="text-xs text-gray-600">Total Requests</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {filteredRequests.filter(req => req.status === 'pending').length}
            </div>
            <div className="text-xs text-gray-600">Pending</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{t('inventory_requests')}</h1>
        {isBartender && (
          <button
            className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium w-full sm:w-auto"
            onClick={() => {
              setFormMessage('');
              setShowModal(true);
            }}
          >
            + {t('new_request')}
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
          // Do NOT multiply by conversion factor. Send only the user-entered value and selected unit.
          try {
            await api.post('/inventory/requests/', {
              product_id: parseInt(formData.product),
              quantity: formData.quantity, // user-entered value
              branch_id: parseInt(formData.branch),
              status: 'pending',
              request_unit_id: unitId, // selected unit
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

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-8">
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-gray-600 italic text-lg">{t('no_requests_found_for_branch')}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block md:hidden space-y-4">
            {filteredRequests.map(req => {
              const reached = Boolean(req.reached_status);
              const canEditOrCancel = isBartender && req.status === 'pending' && req.requested_by === bartenderId;
              return (
                <div key={`${req.id}-${reached ? 'r' : 'nr'}`} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  {/* Header with status */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 text-lg">{req.product?.name || 'N/A'}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        req.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : req.status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  {/* Product Details */}
                  <div className="space-y-2 mb-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs">Category</p>
                        <p className="font-medium text-gray-900">{req.product?.category?.category_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Type</p>
                        <p className="font-medium text-gray-900">{req.product?.category?.item_type?.type_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Quantity</p>
                        <p className="font-medium text-gray-900">{req.quantity}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Unit</p>
                        <p className="font-medium text-gray-900">{req.request_unit?.unit_name || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-gray-500 text-xs mb-1">Basic Unit Quantity</p>
                      <p className="font-semibold text-gray-900">{req.quantity_basic_unit ?? 'N/A'}</p>
                    </div>
                  </div>

                  {/* Branch and Date */}
                  <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                    <span>Branch: {req.branch?.name || 'N/A'}</span>
                    <span>{new Date(req.created_at).toLocaleDateString()}</span>
                  </div>

                  {/* Actions */}
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
                          className="bg-yellow-500 text-white px-3 py-2 rounded-lg hover:bg-yellow-600 disabled:opacity-50 text-sm font-medium"
                        >
                          {t('edit')}
                        </button>
                        <button
                          onClick={() => handleCancelRequest(req.id)}
                          disabled={processingId === req.id}
                          className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 text-sm font-medium"
                        >
                          {t('cancel')}
                        </button>
                      </>
                    )}

                    {/* Manager: Accept pending requests */}
                    {isManager && req.status === 'pending' && (
                      <button
                        onClick={() => handleAccept(req.id)}
                        disabled={processingId === req.id}
                        className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm font-medium"
                      >
                        {t('accept')}
                      </button>
                    )}

                    {/* Reach/Not Reach buttons - only if accepted */}
                    {req.status === 'accepted' && isBartender && !reached && (
                      <button
                        onClick={() => handleReach(req.id)}
                        disabled={processingId === req.id}
                        className="bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm font-medium"
                      >
                        {t('mark_reached')}
                      </button>
                    )}
                    {req.status === 'accepted' && isBartender && reached && (
                      <span className="px-3 py-2 rounded-lg bg-green-200 text-green-900 font-semibold text-sm">
                        {t('reached')}
                      </span>
                    )}

                    {/* No actions available */}
                    {!canEditOrCancel &&
                      !(isManager && req.status === 'pending') &&
                      !(req.status === 'accepted' && isBartender) &&
                      reached && (
                        <span className="px-3 py-2 rounded-lg bg-green-200 text-green-900 font-semibold text-sm">{t('reached')}</span>
                      )}
                    {!canEditOrCancel &&
                      !(isManager && req.status === 'pending') &&
                      !(req.status === 'accepted' && isBartender) &&
                      !reached && (
                        <span className="text-gray-500 italic text-sm px-3 py-2">{t('no_action_available')}</span>
                      )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm">
                <thead className="bg-gray-100">
                  <tr className="text-center">
                    <th className="border px-4 py-2">{t('product')}</th>
                    <th className="border px-4 py-2">{t('category')}</th>
                    <th className="border px-4 py-2">{t('item_type')}</th>
                    <th className="border px-4 py-2">{t('quantity')}</th>
                    <th className="border px-4 py-2">{t('quantity_basic_unit')}</th>
                    <th className="border px-4 py-2">{t('unit_type')}</th>
                    <th className="border px-4 py-2">{t('branch')}</th>
                    <th className="border px-4 py-2">{t('requested_at')}</th>
                    <th className="border px-4 py-2">{t('status')}</th>
                    <th className="border px-4 py-2">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map(req => {
                    const reached = Boolean(req.reached_status);
                    const canEditOrCancel = isBartender && req.status === 'pending' && req.requested_by === bartenderId;
                    return (
                      <tr
                        key={`${req.id}-${reached ? 'r' : 'nr'}`}
                        className="text-center hover:bg-gray-50 transition"
                      >
                        <td className="border px-4 py-2">{req.product?.name || 'N/A'}</td>
                        <td className="border px-4 py-2">{req.product?.category?.category_name || 'N/A'}</td>
                        <td className="border px-4 py-2">{req.product?.category?.item_type?.type_name || 'N/A'}</td>
                        <td className="border px-4 py-2">{req.quantity}</td>
                        <td className="border px-4 py-2">{req.quantity_basic_unit ?? 'N/A'}</td>
                        <td className="border px-4 py-2">{req.request_unit?.unit_name || 'N/A'}</td>
                        <td className="border px-4 py-2">{req.branch?.name || 'N/A'}</td>
                        <td className="border px-4 py-2">{new Date(req.created_at).toLocaleString()}</td>
                        <td className="border px-4 py-2">
                          <span
                            className={`px-2 py-1 rounded text-sm font-medium ${
                              req.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : req.status === 'accepted'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="border px-4 py-2 space-x-2">
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
                                className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 disabled:opacity-50"
                              >
                                {t('edit')}
                              </button>
                              <button
                                onClick={() => handleCancelRequest(req.id)}
                                disabled={processingId === req.id}
                                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 disabled:opacity-50"
                              >
                                {t('cancel')}
                              </button>
                            </>
                          )}

                          {/* Manager: Accept pending requests */}
                          {isManager && req.status === 'pending' && (
                            <button
                              onClick={() => handleAccept(req.id)}
                              disabled={processingId === req.id}
                              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
                            >
                              {t('accept')}
                            </button>
                          )}

                          {/* Reach/Not Reach buttons - only if accepted */}
                          {req.status === 'accepted' && isBartender && !reached && (
                            <button
                              onClick={() => handleReach(req.id)}
                              disabled={processingId === req.id}
                              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:opacity-50"
                            >
                              {t('mark_reached')}
                            </button>
                          )}
                          {req.status === 'accepted' && isBartender && reached && (
                            <span className="px-2 py-1 rounded bg-green-200 text-green-900 font-semibold">
                              {t('reached')}
                            </span>
                          )}

                          {/* No actions available */}
                          {!canEditOrCancel &&
                            !(isManager && req.status === 'pending') &&
                            !(req.status === 'accepted' && isBartender) &&
                            reached && (
                              <span className="px-2 py-1 rounded bg-green-200 text-green-900 font-semibold">{t('reached')}</span>
                            )}
                          {!canEditOrCancel &&
                            !(isManager && req.status === 'pending') &&
                            !(req.status === 'accepted' && isBartender) &&
                            !reached && (
                              <span className="text-gray-500 italic">{t('no_action_available')}</span>
                            )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default InventoryRequestList;
