import React, { useEffect, useState } from 'react';
import axios from 'axios';
import axiosInstance from '../../api/axiosInstance';
import { useTranslation } from 'react-i18next';
import {
  fetchRequests,
  acceptRequest,
  rejectRequest,
} from '../../api/inventory'; // make sure these use axios withCredentials too
import NewRequest from './NewRequest';
import { useAuth } from '../../context/AuthContext';

const InventoryRequestList = () => {
  const { t } = useTranslation();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [units, setUnits] = useState([]);
  const [productMeasurements, setProductMeasurements] = useState({});
  const [formData, setFormData] = useState({
    product: '',
    quantity: '',
    request_unit_id: '',
    status: 'pending',
    branch: '',
  });
  const [formMessage, setFormMessage] = useState('');

  const { user } = useAuth();

  // Filter requests based on user role and branch
  const filteredRequests = requests.filter(req => {
    // If user is a manager, show only requests from their branch
    if (user?.role === 'manager' && user?.branch) {
      return req.branch?.id === user.branch;
    }
    // If user is a bartender, show only their own requests
    if (user?.role === 'bartender') {
      return req.requested_by === user.id;
    }
    // For other roles, show all requests
    return true;
  }).filter(req => {
    // Apply status filter
    if (statusFilter === 'all') return true;
    return req.status === statusFilter;
  });

  useEffect(() => {
    loadRequests();
    loadProducts();
    loadBranches();
    loadUnits();
    loadProductMeasurements();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await fetchRequests();
      setRequests(data);
    } catch (err) {
      console.error(t('error_loading_requests'), err);
      alert(t('error_loading_requests'));
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await axiosInstance.get('inventory/products/');
      setProducts(res.data);
    } catch (err) {
      console.error(t('error_loading_products'), err);
    }
  };

  const loadBranches = async () => {
    try {
      const res = await axiosInstance.get('inventory/branches/');
      setBranches(res.data);
    } catch (err) {
      console.error(t('error_loading_branches'), err);
    }
  };

  const loadUnits = async () => {
    try {
      const res = await axiosInstance.get('inventory/productunits/');
      setUnits(res.data);
    } catch (err) {
      console.error('Error loading units:', err);
    }
  };

  const loadProductMeasurements = async () => {
    try {
      const res = await axiosInstance.get('inventory/productmeasurements/');
      
      // Group measurements by product
      const measurementsByProduct = {};
      res.data.forEach(measurement => {
        if (!measurementsByProduct[measurement.product_id]) {
          measurementsByProduct[measurement.product_id] = [];
        }
        measurementsByProduct[measurement.product_id].push(measurement);
      });
      
      setProductMeasurements(measurementsByProduct);
    } catch (err) {
      console.error('Error loading product measurements:', err);
    }
  };

  // Accept and Reject handlers
  const handleAccept = async (id) => {
    setProcessingId(id);
    try {
      await acceptRequest(id);
      await loadRequests();
      setFormMessage(t('request_accepted'));
    } catch (err) {
      setFormMessage(t('failed_to_accept_request'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    setProcessingId(id);
    try {
      await rejectRequest(id);
      await loadRequests();
      setFormMessage(t('request_rejected'));
    } catch (err) {
      setFormMessage(t('failed_to_reject_request'));
    } finally {
      setProcessingId(null);
    }
  };

  // Handle reaching the request (bartender marks as received)
  const handleReach = async (id) => {
    setProcessingId(id);
    try {
      const response = await axiosInstance.post(`inventory/requests/${id}/reach/`, {});
      await loadRequests();
      setFormMessage(t('request_marked_as_reached'));
    } catch (err) {
      setFormMessage(t('failed_to_mark_reached'));
    } finally {
      setProcessingId(null);
    }
  };

  // Handle not reaching the request
  const handleNotReach = async (id) => {
    setProcessingId(id);
    try {
      const response = await axiosInstance.post(`inventory/requests/${id}/not_reach/`, {});
      await loadRequests();
      setFormMessage(t('request_marked_as_not_reached'));
    } catch (err) {
      setFormMessage(t('failed_to_mark_not_reached'));
    } finally {
      setProcessingId(null);
    }
  };

  // Handle editing request (only for pending requests by the requester)
  const handleEdit = async (id) => {
    // This would open an edit modal or form
    // For now, just show a message
    setFormMessage(t('edit_functionality_coming_soon'));
  };

  // Handle canceling request (only for pending requests by the requester)
  const handleCancel = async (id) => {
    if (window.confirm(t('confirm_cancel_request'))) {
      setProcessingId(id);
      try {
        const response = await axiosInstance.patch(`inventory/requests/${id}/`, {
          status: 'cancelled'
        });
        await loadRequests();
        setFormMessage(t('request_cancelled'));
      } catch (err) {
        setFormMessage(t('failed_to_cancel_request'));
      } finally {
        setProcessingId(null);
      }
    }
  };









  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

         if (!formData.product || !formData.branch || !formData.quantity || !formData.request_unit_id || Number(formData.quantity) <= 0) {
       setFormMessage('Please fill in all required fields: Product, Branch, Quantity, and Unit.');
       return;
     }

         try {
       console.log('Submitting request with data:', formData);
       
       // Get conversion info for logging
       const conversion = productMeasurements[formData.product]?.find(m => m.from_unit_id === parseInt(formData.request_unit_id));
       if (conversion) {
         const totalIndividualUnits = parseFloat(formData.quantity) * conversion.amount_per;
         console.log(`Conversion: ${formData.quantity} ${conversion.from_unit_name} = ${totalIndividualUnits} ${conversion.to_unit_id}`);
       }
       
       const requestData = {
         product_id: parseInt(formData.product),
         quantity: parseFloat(formData.quantity),
         request_unit_id: parseInt(formData.request_unit_id),
         status: 'pending',
         branch_id: parseInt(formData.branch),
       };
       console.log('Sending to backend:', requestData);
       
       await axios.post(
         'inventory/requests/',
         requestData,
         {
           headers: { 'Content-Type': 'application/json' },
           withCredentials: true,
         }
       );

      setFormMessage(t('request_submitted_successfully'));
             setFormData({
         product: '',
         quantity: '',
         request_unit_id: '',
         status: 'pending',
         branch: formData.branch,
       });
      setShowModal(false);
      await loadRequests();
    } catch (err) {
      console.error(err);
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

      setFormMessage(messages.join(' | ') || t('unknown_submission_error'));
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{t('inventory_requests_title')}</h1>
        <div className="flex items-center gap-4">
          {/* New Request Button - Only for Bartenders */}
          {user?.role === 'bartender' && (
            <button
              onClick={() => {
                setFormMessage('');
                setShowModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              + {t('new_request')}
            </button>
          )}
          
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="fulfilled">Fulfilled</option>
          </select>
          
          {/* Refresh Button */}
          <button
            onClick={loadRequests}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

             <NewRequest
         showModal={showModal}
         setShowModal={setShowModal}
         formData={formData}
         formMessage={formMessage}
         products={products}
         branches={branches}
         units={units}
         productMeasurements={productMeasurements}
         handleFormChange={handleFormChange}
         handleFormSubmit={handleFormSubmit}
       />

      {loading ? (
        <p>{t('loading_requests')}</p>
      ) : filteredRequests.length === 0 ? (
        <p className="text-gray-600 italic">
          {requests.length === 0 ? t('no_requests_found') : `No requests found with status: ${statusFilter}`}
        </p>
      ) : (
        <>
          {/* Status Summary */}
          <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {requests.filter(r => r.status === 'pending').length}
              </div>
              <div className="text-sm text-yellow-700">Pending</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {requests.filter(r => r.status === 'accepted').length}
              </div>
              <div className="text-sm text-blue-700">Accepted</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {requests.filter(r => r.status === 'fulfilled').length}
              </div>
              <div className="text-sm text-green-700">Fulfilled</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {requests.filter(r => r.status === 'rejected').length}
              </div>
              <div className="text-sm text-red-700">Rejected</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">
                {filteredRequests.length}
              </div>
              <div className="text-sm text-gray-700">Filtered</div>
            </div>
          </div>

          <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100">
              <tr className="text-center">
                <th className="border px-4 py-2">{t('product')}</th>
                <th className="border px-4 py-2">{t('category')}</th>
                <th className="border px-4 py-2">{t('item_type')}</th>
                                 <th className="border px-4 py-2">{t('quantity')}</th>
                 <th className="border px-4 py-2">{t('input_unit')}</th>
                 <th className="border px-4 py-2">{t('total_units')}</th>
                 <th className="border px-4 py-2">{t('branch')}</th>
                <th className="border px-4 py-2">{t('requested_at')}</th>
                <th className="border px-4 py-2">{t('status')}</th>
                <th className="border px-4 py-2">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req) => (
                <tr key={req.id} className="text-center hover:bg-gray-50 transition">
                  <td className="border px-4 py-2">{req.product?.name || t('na')}</td>
                  <td className="border px-4 py-2">{req.product?.category?.category_name || t('na')}</td>
                  <td className="border px-4 py-2">{req.product?.category?.item_type?.type_name || t('na')}</td>
                                     <td className="border px-4 py-2">{req.quantity}</td>
                   <td className="border px-4 py-2">{req.request_unit?.unit_name || t('na')}</td>
                   <td className="border px-4 py-2">
                     {(() => {
                       const conversion = productMeasurements[req.product?.id]?.find(m => m.from_unit_id === req.request_unit?.id);
                       if (conversion) {
                         const totalUnits = parseFloat(req.quantity) * conversion.amount_per;
                         return `${totalUnits} ${conversion.to_unit_id}`;
                       }
                       return t('na');
                     })()}
                   </td>
                   <td className="border px-4 py-2">{req.branch?.name || t('na')}</td>
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
                      {t(req.status)}
                    </span>
                  </td>


                  <td className="border px-4 py-2 space-x-2">
  {req.status === 'pending' ? (
    <>
      <button
        onClick={() => handleAccept(req.id)}
        disabled={processingId === req.id}
        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:opacity-50 mr-2"
      >
        Accept
      </button>
      <button
        onClick={() => handleReject(req.id)}
        disabled={processingId === req.id}
        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 disabled:opacity-50"
      >
        Reject
      </button>
      {user.role === 'bartender' && req.requested_by === user.id && (
        <>
          <button
            onClick={() => handleEdit(req.id)}
            disabled={processingId === req.id}
            className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 disabled:opacity-50 mr-2"
          >
            Edit
          </button>
          <button
            onClick={() => handleCancel(req.id)}
            disabled={processingId === req.id}
            className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 disabled:opacity-50"
          >
            Cancel
          </button>
        </>
      )}
    </>
  ) : req.status === 'accepted' && user.role === 'bartender' && req.requested_by === user.id && !req.reached_status ? (
    <>
      <button
        onClick={() => handleReach(req.id)}
        disabled={processingId === req.id}
        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:opacity-50 mr-2"
      >
        Reached
      </button>
      <button
        onClick={() => handleNotReach(req.id)}
        disabled={processingId === req.id}
        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 disabled:opacity-50"
      >
        Not Reached
      </button>
    </>
  ) : req.status === 'accepted' && req.reached_status ? (
    <span className="px-2 py-1 rounded bg-green-200 text-green-900 font-semibold">
      {t('reached')}
    </span>
  ) : req.status === 'rejected' ? (
    <span className="px-2 py-1 rounded bg-red-200 text-red-900 font-semibold">
      {t('rejected')}
    </span>
  ) : req.reached_status ? (
    <span className="px-2 py-1 rounded bg-green-200 text-green-900 font-semibold">{t('reached')}</span>
  ) : (
    <span className="text-gray-500 italic">{t('no_action_available')}</span>
  )}
</td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
};

export default InventoryRequestList;
