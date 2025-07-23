import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import {
  fetchRequests,
  acceptRequest,
  rejectRequest,
} from '../../api/inventory'; // make sure these use axios withCredentials too
import NewRequest from './NewRequest';

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

  const handleAccept = async (id) => {
    setProcessingId(id);
    try {
      await acceptRequest(id);
      await loadRequests();
    } catch (err) {
      console.error(t('accept_failed'), err);
      alert(t('accept_failed'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    setProcessingId(id);
    try {
      await rejectRequest(id);
      await loadRequests();
    } catch (err) {
      console.error(t('reject_failed'), err);
      alert(t('reject_failed'));
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
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:opacity-50"
                        >
                          {t('accept')}
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          disabled={processingId === req.id}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 disabled:opacity-50"
                        >
                          {t('reject')}
                        </button>
                      </>
                    ) : req.status === 'accepted' ? (
                      <span className={`font-semibold ${req.reached_status ? 'text-green-600' : 'text-red-600'}`}>
                        {req.reached_status ? t('reached') : t('not_reached')}
                      </span>
                    ) : (
                      <span className="text-gray-500 italic">{t('no_actions')}</span>
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
