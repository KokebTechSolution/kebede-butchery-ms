import React, { useState, useEffect } from 'react';
import { fetchRequests, ReachRequest } from '../../../api/inventory';
import BarmanStockStatus from './BarmanStockStatus';
import NewRequest from './NewRequest';
import api from '../../../api/axiosInstance';
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

  // Trigger to refresh stocks
  const [refreshStockTrigger, setRefreshStockTrigger] = useState(0);

  // Edit and Delete modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingRequest, setDeletingRequest] = useState(null);

  const { user } = useAuth();
  const branchId = user?.branch;
  const bartenderId = user?.id;

  useEffect(() => {
    loadRequests();
    loadProducts();
    loadBranches();
  }, []);

  useEffect(() => {
    fetchBarmanStocks();
  }, [refreshStockTrigger]);

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
      const data = await fetchRequests(); // should internally use api with session
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
      const res = await api.get('/inventory/inventory/');
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

  const handleReach = async (id) => {
    console.log('DEBUG: handleReach called with id:', id);
    
    // Find the request to check its status
    const request = requests.find(req => req.id === id);
    console.log('DEBUG: Request found:', request);
    console.log('DEBUG: Request status:', request?.status);
    console.log('DEBUG: Request reached_status:', request?.reached_status);
    
    setProcessingId(id);
    try {
      console.log('DEBUG: Calling ReachRequest...');
      await ReachRequest(id); // ensure ReachRequest uses api with credentials
      console.log('DEBUG: ReachRequest completed successfully');
      await loadRequests();
      console.log('DEBUG: Requests reloaded');
      setRefreshStockTrigger((prev) => prev + 1);
      console.log('DEBUG: Stock refresh triggered');
    } catch (err) {
      console.error('DEBUG: Error in handleReach:', err);
      console.error('Failed to mark as reached:', err.response?.data || err.message);
      alert('Failed to mark as Reached: ' + (err.response?.data?.detail || err.message));
    } finally {
      setProcessingId(null);
    }
  };

  const handleEditRequest = (request) => {
    setEditingRequest({
      id: request.id,
      product_id: request.product?.id,
      quantity: request.quantity,
      unit_type: request.unit_type,
      branch_id: request.branch?.id
    });
    setShowEditModal(true);
  };

  const handleDeleteRequest = (request) => {
    setDeletingRequest(request);
    setShowDeleteModal(true);
  };

  const confirmDeleteRequest = async () => {
    if (!deletingRequest) return;
    
    try {
      await api.delete(`/inventory/requests/${deletingRequest.id}/`);
      alert('Request deleted successfully!');
      setShowDeleteModal(false);
      setDeletingRequest(null);
      await loadRequests();
    } catch (err) {
      console.error('Failed to delete request:', err);
      alert('Failed to delete request: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleEditSubmit = async (editedData) => {
    try {
      await api.patch(`/inventory/requests/${editedData.id}/`, {
        product_id: editedData.product_id,
        quantity: editedData.quantity,
        unit_type: editedData.unit_type,
        branch_id: editedData.branch_id
      });
      alert('Request updated successfully!');
      setShowEditModal(false);
      setEditingRequest(null);
      await loadRequests();
    } catch (err) {
      console.error('Failed to update request:', err);
      alert('Failed to update request: ' + (err.response?.data?.detail || err.message));
    }
  };

  // Filter by branch id (branch_id or nested branch.id)
  const filteredRequests = requests.filter(
    (req) =>
      String(req.branch_id || req.branch?.id) === String(branchId)
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
        setFormData={setFormData}
        formMessage={formMessage}
        products={products}
        branches={branches}
        handleFormChange={(e) => {
          const { name, value } = e.target;
          setFormData((prev) => ({ ...prev, [name]: value }));
        }}
        handleFormSubmit={async () => {
          // Just refresh the requests list
          await loadRequests();
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
                  <tr
                    key={`${req.id}-${reached ? 'r' : 'nr'}`}
                    className="text-center hover:bg-gray-50 transition"
                  >
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
                      {req.status === 'pending' ? (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleEditRequest(req)}
                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteRequest(req)}
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      ) : req.status === 'accepted' ? (
                        !reached ? (
                          <button
                            onClick={() => handleReach(req.id)}
                            disabled={processingId === req.id}
                            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:opacity-50"
                          >
                            Reach
                          </button>
                        ) : (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded font-medium">
                            Accepted
                          </span>
                        )
                      ) : (
                        <span className="text-gray-500">No actions</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Request Modal */}
      {showEditModal && editingRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Edit Request</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Product:</label>
                <select
                  value={editingRequest.product_id || ''}
                  onChange={(e) => {
                    const productId = e.target.value;
                    const selectedProduct = products.find(p => p.id === productId);
                    let newUnitType = editingRequest.unit_type;
                    
                    // Automatically set unit type to product's base unit
                    if (selectedProduct && selectedProduct.base_unit) {
                      newUnitType = selectedProduct.base_unit;
                    } else if (selectedProduct && selectedProduct.available_units) {
                      // Fallback: set to first available unit if base_unit is not available
                      if (!selectedProduct.available_units.includes(editingRequest.unit_type)) {
                        newUnitType = selectedProduct.available_units[0] || 'unit';
                      }
                    }
                    
                    setEditingRequest({
                      ...editingRequest, 
                      product_id: productId,
                      unit_type: newUnitType
                    });
                  }}
                  className="w-full border p-2 rounded"
                >
                  <option value="">Select Product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Quantity:</label>
                <input
                  type="number"
                  value={editingRequest.quantity || ''}
                  onChange={(e) => setEditingRequest({...editingRequest, quantity: e.target.value})}
                  className="w-full border p-2 rounded"
                  min="0.01"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Unit Type:</label>
                <select
                  value={editingRequest.unit_type || ''}
                  onChange={(e) => setEditingRequest({...editingRequest, unit_type: e.target.value})}
                  className="w-full border p-2 rounded"
                >
                  {(() => {
                    const selectedProduct = products.find(p => p.id === editingRequest.product_id);
                    const availableUnits = selectedProduct?.available_units || ['unit', 'carton', 'bottle', 'litre', 'shot'];
                    
                    return availableUnits.map(unit => {
                      const isBaseUnit = selectedProduct && selectedProduct.base_unit === unit;
                      return (
                        <option key={unit} value={unit}>
                          {unit.charAt(0).toUpperCase() + unit.slice(1)} {isBaseUnit ? '(default)' : ''}
                        </option>
                      );
                    });
                  })()}
                </select>
                {(() => {
                  const selectedProduct = products.find(p => p.id === editingRequest.product_id);
                  if (selectedProduct?.available_units) {
                    return (
                      <p className="text-xs text-gray-500 mt-1">
                        Available units: {selectedProduct.available_units.map(unit => {
                          const isBaseUnit = selectedProduct.base_unit === unit;
                          return isBaseUnit ? `${unit} (default)` : unit;
                        }).join(', ')}
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Branch:</label>
                <select
                  value={editingRequest.branch_id || ''}
                  onChange={(e) => setEditingRequest({...editingRequest, branch_id: e.target.value})}
                  className="w-full border p-2 rounded"
                >
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingRequest(null);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => handleEditSubmit(editingRequest)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Update Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Delete Request</h3>
            <p className="mb-4">
              Are you sure you want to delete the request for{' '}
              <strong>{deletingRequest.product?.name}</strong> ({deletingRequest.quantity} {deletingRequest.unit_type})?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingRequest(null);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteRequest}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryRequestList;
