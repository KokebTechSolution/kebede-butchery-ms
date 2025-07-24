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

  return (
    <div className="p-4">
      <BarmanStockStatus stocks={stocks} tab={tab} setTab={setTab} bartenderId={bartenderId} />

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Inventory Request History</h1>
        {isBartender && (
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => {
              setFormMessage('');
              setShowModal(true);
            }}
          >
            + New Request
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
        <p>Loading requests...</p>
      ) : filteredRequests.length === 0 ? (
        <p className="text-gray-600 italic">No requests found for your branch.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100">
              <tr className="text-center">
                <th className="border px-4 py-2">Product</th>
                <th className="border px-4 py-2">Category</th>
                <th className="border px-4 py-2">Item Type</th>
                <th className="border px-4 py-2">Quantity</th>
                <th className="border px-4 py-2">Quantity (Basic Unit)</th>
                <th className="border px-4 py-2">Unit Type</th>
                <th className="border px-4 py-2">Branch</th>
                <th className="border px-4 py-2">Requested At</th>
                <th className="border px-4 py-2">Status</th>
                <th className="border px-4 py-2">Actions</th>
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
                              // Open edit modal or inline edit - implement as you want
                              const updatedQty = prompt('Enter new quantity:', req.quantity);
                              if (updatedQty && !isNaN(updatedQty) && Number(updatedQty) > 0) {
                                handleEditRequest(req.id, { quantity: Number(updatedQty) });
                              }
                            }}
                            disabled={processingId === req.id}
                            className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleCancelRequest(req.id)}
                            disabled={processingId === req.id}
                            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 disabled:opacity-50"
                          >
                            Cancel
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
                          Accept
                        </button>
                      )}

                      {/* Reach/Not Reach buttons - only if accepted */}
                      {req.status === 'accepted' && isBartender && !reached && (
                        <button
                          onClick={() => handleReach(req.id)}
                          disabled={processingId === req.id}
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:opacity-50"
                        >
                          Mark Reached
                        </button>
                      )}
                      {req.status === 'accepted' && isBartender && reached && (
                        <span className="px-2 py-1 rounded bg-green-200 text-green-900 font-semibold">
                          Reached
                        </span>
                      )}

                      {/* No actions available */}
                      {!canEditOrCancel &&
                        !(isManager && req.status === 'pending') &&
                        !(req.status === 'accepted' && isBartender) && (
                          <span className="text-gray-500 italic">No action available</span>
                        )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InventoryRequestList;
