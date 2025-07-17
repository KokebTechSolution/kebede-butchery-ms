import React, { useEffect, useState } from 'react';
import {
  fetchRequests,
  ReachRequest,
  NotReachRequest,
} from '../../../api/inventory';
import api from '../../../api/axiosInstance';
import axios from 'axios';
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
    unit_type: 'unit',
    status: 'pending',
    branch: '',
  });
  const [formMessage, setFormMessage] = useState('');

  // This trigger forces stock refetch and re-render when incremented
  const [refreshStockTrigger, setRefreshStockTrigger] = useState(0);

  // Get branchId from user context
  const { user } = useAuth();
  const branchId = user?.branch;
  const bartenderId = user?.id; 

  useEffect(() => {
    loadRequests();
    loadProducts();
    loadBranches();
  }, []);

  useEffect(() => {
    // Fetch barman stocks whenever refreshStockTrigger changes
    fetchBarmanStocks();
  }, [refreshStockTrigger]);

  const fetchBarmanStocks = async () => {
    try {
      const res = await api.get('/inventory/barman-stock/', {
        withCredentials: true,
      });
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
      const token = localStorage.getItem('access');
      const res = await axios.get('http://localhost:8000/api/inventory/inventory/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const loadBranches = async () => {
    try {
      const token = localStorage.getItem('access');
      const res = await axios.get('http://localhost:8000/api/inventory/branches/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBranches(res.data);
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    }
  };

  const handleReach = async (id) => {
    setProcessingId(id);
    try {
      await ReachRequest(id);
      await loadRequests();
      setRefreshStockTrigger((prev) => prev + 1); // Trigger barman stock refresh
    } catch (err) {
      console.error('Failed to mark as reached:', err.response?.data || err.message);
      alert('Failed to mark as Reached: ' + (err.response?.data?.detail || err.message));
    } finally {
      setProcessingId(null);
    }
  };

  const handleNotReach = async (id) => {
    setProcessingId(id);
    try {
      await NotReachRequest(id);
      await loadRequests();
      setRefreshStockTrigger((prev) => prev + 1); // Trigger barman stock refresh
    } catch (err) {
      console.error('Failed to mark as not reached:', err);
      alert('Failed to mark as Not Reached');
    } finally {
      setProcessingId(null);
    }
  };

  // Filter requests by branchId (works for both branch_id and branch.id)
  const filteredRequests = requests.filter(
    req =>
      String(req.branch_id || (req.branch && req.branch.id)) === String(branchId)
  );

  return (
    <div className="p-4">
      <BarmanStockStatus
        stocks={stocks}
        tab={tab}
        setTab={setTab}
        bartenderId={bartenderId}
      />

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Inventory Request History</h1>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => {
            setFormMessage('');
            setShowModal(true);
          }}
        >
          + New Request
        </button>
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
          setFormData((prev) => ({ ...prev, [name]: value }));
        }}
        handleFormSubmit={async (e) => {
          e.preventDefault();
          if (!formData.product || !formData.branch || !formData.quantity || Number(formData.quantity) <= 0) {
            setFormMessage('Please select a product, branch, and enter a valid quantity.');
            return;
          }
          try {
            const token = localStorage.getItem('access');
            await axios.post(
              'http://localhost:8000/api/inventory/requests/',
              {
                product_id: parseInt(formData.product),
                quantity: parseFloat(formData.quantity),
                unit_type: formData.unit_type,
                status: 'pending',
                branch_id: parseInt(formData.branch),
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }
            );
            setFormMessage('Request submitted successfully!');
            setFormData({
              product: '',
              quantity: '',
              unit_type: 'unit',
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
            setFormMessage(messages.join(' | ') || 'Submission failed.');
          }
        }}
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
                <th className="border px-4 py-2">Unit Type</th>
                <th className="border px-4 py-2">Branch</th>
                <th className="border px-4 py-2">Requested At</th>
                <th className="border px-4 py-2">Status</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req) => {
                const reached = Boolean(req.reached_status);
                return (
                  <tr key={`${req.id}-${reached ? 'r' : 'nr'}`} className="text-center hover:bg-gray-50 transition">
                    <td className="border px-4 py-2">{req.product?.name || 'N/A'}</td>
                    <td className="border px-4 py-2">{req.product?.category?.category_name || 'N/A'}</td>
                    <td className="border px-4 py-2">{req.product?.category?.item_type?.type_name || 'N/A'}</td>
                    <td className="border px-4 py-2">{req.quantity}</td>
                    <td className="border px-4 py-2">{req.unit_type}</td>
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
                    <td className="border px-4 py-2">
                      {req.status === 'accepted' ? (
                        !reached ? (
                          <>
                            <button
                              onClick={() => handleReach(req.id)}
                              disabled={processingId === req.id}
                              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:opacity-50"
                            >
                              Reached
                            </button>
                            <button
                              onClick={() => handleNotReach(req.id)}
                              disabled={processingId === req.id}
                              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 disabled:opacity-50 ml-2"
                            >
                              Not Reached
                            </button>
                          </>
                        ) : (
                          <span className="px-2 py-1 rounded bg-green-200 text-green-900 font-semibold">
                            Reach mark
                          </span>
                        )
                      ) : (
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