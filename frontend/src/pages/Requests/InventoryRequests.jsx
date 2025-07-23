import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  fetchRequests,
  acceptRequest,
  rejectRequest,
  fetchProducts,
  fetchBranches,
  // If you later add a createInventoryRequest function to your api/inventory.js,
  // you would import it here. For now, we'll keep the direct axios.post.
} from '../../api/inventory';

// Note: Direct axios import for new request creation.
// Ideally, this would be encapsulated in a `createInventoryRequest` function
// within your `../../api/inventory.js` for consistency.
import axios from 'axios';

// Utility to read cookie by name (for CSRF token) - needed for direct axios calls
// This is duplicated from inventory.js but necessary if you keep direct axios.post here.
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.startsWith(name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const InventoryRequestList = () => {
  const { t } = useTranslation();

  // --- State Management ---
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null); // Simple error message string

  const [processingId, setProcessingId] = useState(null); // For loading states on individual actions
  const [showNewRequestForm, setShowNewRequestForm] = useState(false); // Controls visibility of the new request form

  // Data for the New Request form
  const [productsForNewRequest, setProductsForNewRequest] = useState([]);
  const [branchesForNewRequest, setBranchesForNewRequest] = useState([]);
  const [newRequestFormData, setNewRequestFormData] = useState({
    product: '',
    quantity: '',
    unit_type: 'unit',
    branch: '',
  });
  const [newRequestFormMessage, setNewRequestFormMessage] = useState(''); // Message for the New Request form (success/error)


  // --- Data Loading Functions ---

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null); // Clear previous errors
    try {
      const data = await fetchRequests();
      // Defensive check: API might return an object with 'results' for pagination
      if (Array.isArray(data)) {
        setRequests(data);
      } else if (data && Array.isArray(data.results)) {
        setRequests(data.results);
      } else {
        console.warn("API returned unexpected format for requests:", data);
        setRequests([]); // Fallback to empty array
      }
    } catch (err) {
      console.error("Failed to fetch inventory requests:", err);
      setErrorMessage(t('error_loading_requests') + ": " + (err.response?.data?.detail || err.message || t('network_error')));
      setRequests([]); // Ensure requests is an array even on error
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadProductsAndBranchesForForm = useCallback(async () => {
    try {
      const productsData = await fetchProducts();
      const branchesData = await fetchBranches();

      setProductsForNewRequest(Array.isArray(productsData) ? productsData : productsData.results || []);
      setBranchesForNewRequest(Array.isArray(branchesData) ? branchesData : branchesData.results || []);
    } catch (err) {
      console.error(t('error_loading_form_data'), err);
      // It might be okay to just log here if the main table loading is covered.
    }
  }, [t]);


  // --- Effects ---
  useEffect(() => {
    loadRequests();
    loadProductsAndBranchesForForm();
  }, [loadRequests, loadProductsAndBranchesForForm]);


  // --- Handlers for Request Actions ---

  const handleAccept = async (id) => {
    const requestToAccept = requests.find(req => req.id === id);
    if (!requestToAccept) {
        alert(t('request_not_found'));
        return;
    }

    const amountToAccept = parseFloat(prompt(t('enter_quantity_to_accept_for', { product: requestToAccept.product?.name || 'product' }), requestToAccept.quantity));

    if (isNaN(amountToAccept) || amountToAccept <= 0) {
      alert(t('please_enter_valid_quantity_positive'));
      return;
    }

    setProcessingId(id);
    try {
      await acceptRequest(id, amountToAccept); // Pass the amount
      alert(t('request_accepted_successfully'));
      await loadRequests();
    } catch (err) {
      console.error(t('accept_failed'), err.response?.data || err.message);
      alert(t('accept_failed') + ": " + (err.response?.data?.detail || err.message || t('network_error')));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm(t('confirm_reject_request'))) return;

    setProcessingId(id);
    try {
      await rejectRequest(id);
      alert(t('request_rejected_successfully'));
      await loadRequests();
    } catch (err) {
      console.error(t('reject_failed'), err.response?.data || err.message);
      alert(t('reject_failed') + ": " + (err.response?.data?.detail || err.message || t('network_error')));
    } finally {
      setProcessingId(null);
    }
  };

  // --- Handlers for New Request Form ---

  const handleNewRequestFormChange = (e) => {
    const { name, value } = e.target;
    setNewRequestFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNewRequestFormSubmit = async (e) => {
    e.preventDefault();
    setNewRequestFormMessage(''); // Clear previous messages

    if (!newRequestFormData.product || !newRequestFormData.branch || !newRequestFormData.quantity || Number(newRequestFormData.quantity) <= 0) {
      setNewRequestFormMessage(t('form_validation_error'));
      return;
    }

    try {
      await axios.post(
        'http://localhost:8000/api/inventory/requests/',
        {
          product: parseInt(newRequestFormData.product),
          quantity: parseFloat(newRequestFormData.quantity),
          unit_type: newRequestFormData.unit_type,
          status: 'pending',
          branch: parseInt(newRequestFormData.branch),
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
          },
        }
      );

      setNewRequestFormMessage(t('request_submitted_successfully'));
      setNewRequestFormData({ // Reset form, keep branch for convenience if common
        product: '',
        quantity: '',
        unit_type: 'unit',
        branch: newRequestFormData.branch,
      });
      setShowNewRequestForm(false); // Hide the form after submission
      await loadRequests(); // Reload requests list
    } catch (err) {
      console.error("New request submission error:", err.response?.data || err.message);
      const errors = err.response?.data || {};
      const messages = [];

      if (typeof errors === 'string') {
        messages.push(errors);
      } else if (typeof errors === 'object' && errors !== null) {
        for (const key in errors) {
          if (Object.prototype.hasOwnProperty.call(errors, key)) {
            const errorValue = errors[key];
            if (Array.isArray(errorValue)) {
              messages.push(`${t(key)}: ${errorValue.join(', ')}`);
            } else if (typeof errorValue === 'object' && errorValue !== null) {
              messages.push(`${t(key)}: ${Object.values(errorValue).flat().join(', ')}`);
            } else {
              messages.push(`${t(key)}: ${errorValue}`);
            }
          }
        }
      }
      setNewRequestFormMessage(messages.join(' | ') || t('unknown_submission_error'));
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{t('inventory_requests_title')}</h1>
        <button
          onClick={() => setShowNewRequestForm(!showNewRequestForm)} // Toggle form visibility
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          {showNewRequestForm ? t('hide_form') : t('create_new_request')}
        </button>
      </div>

      {/* New Request Form (Conditionally rendered) */}
      {showNewRequestForm && (
        <div className="mb-8 p-4 border rounded-lg shadow-sm bg-white">
          <h2 className="text-xl font-semibold mb-4">{t('create_new_inventory_request')}</h2>
          {newRequestFormMessage && (
            <div className={`mb-4 p-3 rounded text-sm ${newRequestFormMessage.includes(t('successfully')) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {newRequestFormMessage}
            </div>
          )}
          <form onSubmit={handleNewRequestFormSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="product" className="block text-sm font-medium text-gray-700">{t('product')}</label>
                <select
                  id="product"
                  name="product"
                  value={newRequestFormData.product}
                  onChange={handleNewRequestFormChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                >
                  <option value="">{t('select_product')}</option>
                  {productsForNewRequest.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="branch" className="block text-sm font-medium text-gray-700">{t('branch')}</label>
                <select
                  id="branch"
                  name="branch"
                  value={newRequestFormData.branch}
                  onChange={handleNewRequestFormChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                >
                  <option value="">{t('select_branch')}</option>
                  {branchesForNewRequest.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">{t('quantity')}</label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={newRequestFormData.quantity}
                  onChange={handleNewRequestFormChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>
              <div>
                <label htmlFor="unit_type" className="block text-sm font-medium text-gray-700">{t('unit_type')}</label>
                <input
                  type="text" // Or a select if you have predefined unit types
                  id="unit_type"
                  name="unit_type"
                  value={newRequestFormData.unit_type}
                  onChange={handleNewRequestFormChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              {t('submit_request')}
            </button>
          </form>
        </div>
      )}

      {/* Main Request List Content */}
      {loading ? (
        <p className="text-center py-4">{t('loading_requests')}...</p>
      ) : errorMessage ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">{t('error')}:</strong>
          <span className="block sm:inline"> {errorMessage}</span>
          <button onClick={loadRequests} className="ml-4 text-sm font-semibold underline">{t('retry')}</button>
        </div>
      ) : requests.length === 0 ? (
        <p className="text-gray-600 italic text-center py-4">{t('no_requests_found')}</p>
      ) : (
        <div className="overflow-x-auto shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('id')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('product')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('category')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('item_type')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('quantity')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('unit_type')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('branch')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('requested_by')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('requested_at')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-100 transition duration-150 ease-in-out">
                  <td className="px-6 py-4 whitespace-nowrap">{req.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{req.product?.name || t('na')}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{req.product?.category?.category_name || t('na')}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{req.product?.category?.item_type?.type_name || t('na')}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{req.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{req.unit_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{req.requesting_branch?.name || t('na')}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{req.requested_by?.username || t('na')}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(req.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {req.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleAccept(req.id)}
                          disabled={processingId === req.id}
                          className="bg-green-500 text-white px-3 py-1 rounded-md text-sm hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed mr-2"
                        >
                          {processingId === req.id ? t('processing') : t('accept')}
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          disabled={processingId === req.id}
                          className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingId === req.id ? t('processing') : t('reject')}
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-500 italic">{t('no_actions_available')}</span>
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