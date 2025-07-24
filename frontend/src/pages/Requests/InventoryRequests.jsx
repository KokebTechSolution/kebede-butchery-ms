import React, { useEffect, useState } from 'react';
import axios from 'axios';
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

  const { user } = useAuth();

  useEffect(() => {
    loadRequests();
    loadProducts();
    loadBranches();
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
      const res = await axios.get('http://localhost:8000/api/inventory/products/', {
        withCredentials: true,
      });
      setProducts(res.data);
    } catch (err) {
      console.error(t('error_loading_products'), err);
    }
  };

  const loadBranches = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/inventory/branches/', {
        withCredentials: true,
      });
      setBranches(res.data);
    } catch (err) {
      console.error(t('error_loading_branches'), err);
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

  const handleEdit = async (id) => {
    setProcessingId(id);
    try {
      await axios.post(`http://localhost:8000/api/inventory/requests/${id}/edit/`, {}, { withCredentials: true });
      await loadRequests();
      setFormMessage('Request edited!');
    } catch (err) {
      setFormMessage('Failed to edit request.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (id) => {
    setProcessingId(id);
    try {
      await axios.post(`http://localhost:8000/api/inventory/requests/${id}/cancel/`, {}, { withCredentials: true });
      await loadRequests();
      setFormMessage('Request cancelled!');
    } catch (err) {
      setFormMessage('Failed to cancel request.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReach = async (id) => {
    setProcessingId(id);
    try {
      await axios.post(`http://localhost:8000/api/inventory/requests/${id}/reach/`, {}, { withCredentials: true });
      await loadRequests();
      setFormMessage('Request reached!');
    } catch (err) {
      setFormMessage('Failed to mark as reached.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleNotReach = async (id) => {
    setProcessingId(id);
    try {
      await axios.post(`http://localhost:8000/api/inventory/requests/${id}/not_reach/`, {}, { withCredentials: true });
      await loadRequests();
      setFormMessage('Request not reached!');
    } catch (err) {
      setFormMessage('Failed to mark as not reached.');
    } finally {
      setProcessingId(null);
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

    if (!formData.product || !formData.branch || !formData.quantity || Number(formData.quantity) <= 0) {
      setFormMessage(t('form_validation_error'));
      return;
    }

    try {
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
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );

      setFormMessage(t('request_submitted_successfully'));
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
      </div>

      <NewRequest
        showModal={showModal}
        setShowModal={setShowModal}
        formData={formData}
        formMessage={formMessage}
        products={products}
        branches={branches}
        handleFormChange={handleFormChange}
        handleFormSubmit={handleFormSubmit}
      />

      {loading ? (
        <p>{t('loading_requests')}</p>
      ) : requests.length === 0 ? (
        <p className="text-gray-600 italic">{t('no_requests_found')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100">
              <tr className="text-center">
                <th className="border px-4 py-2">{t('product')}</th>
                <th className="border px-4 py-2">{t('category')}</th>
                <th className="border px-4 py-2">{t('item_type')}</th>
                <th className="border px-4 py-2">{t('quantity')}</th>
                <th className="border px-4 py-2">{t('unit_type')}</th>
                <th className="border px-4 py-2">{t('branch')}</th>
                <th className="border px-4 py-2">{t('requested_at')}</th>
                <th className="border px-4 py-2">{t('status')}</th>
                <th className="border px-4 py-2">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="text-center hover:bg-gray-50 transition">
                  <td className="border px-4 py-2">{req.product?.name || t('na')}</td>
                  <td className="border px-4 py-2">{req.product?.category?.category_name || t('na')}</td>
                  <td className="border px-4 py-2">{req.product?.category?.item_type?.type_name || t('na')}</td>
                  <td className="border px-4 py-2">{req.quantity}</td>
                  <td className="border px-4 py-2">{req.unit_type}</td>
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
      Reached
    </span>
  ) : req.status === 'rejected' ? (
    <span className="px-2 py-1 rounded bg-red-200 text-red-900 font-semibold">
      Rejected
    </span>
  ) : (
    <span className="text-gray-500 italic">No action available</span>
  )}
</td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InventoryRequestList;
