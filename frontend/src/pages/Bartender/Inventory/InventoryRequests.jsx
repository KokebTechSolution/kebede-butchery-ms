import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  fetchRequests,
  fetchProducts,
  fetchBranches,
  getBarmanStock, // Corrected import name: 'fetchBarmanStocks' is now 'getBarmanStock'
  // Removed: ReachRequest, NotReachRequest
} from '../../../api/inventory';

import NewRequest from './NewRequest';
import BarmanStockStatus from './BarmanStockStatus';
import { useAuth } from '../../../context/AuthContext';

const InventoryRequestList = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const branchId = user?.branch;
  const bartenderId = user?.id;

  // --- State Management ---
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // No longer needed since NewRequest handles its own submission state and messages
  // const [processingId, setProcessingId] = useState(null);

  const [showNewRequestModal, setShowNewRequestModal] = useState(false);

  // Data for the New Request form (passed to NewRequest component)
  const [productsForNewRequest, setProductsForNewRequest] = useState([]);
  const [branchesForNewRequest, setBranchesForNewRequest] = useState([]);
  // Removed: newRequestFormMessage and setNewRequestFormMessage


  // Barman Stock status
  const [barmanStocks, setBarmanStocks] = useState([]);
  const [barmanStockLoading, setBarmanStockLoading] = useState(true);
  const [barmanStockError, setBarmanStockError] = useState(null);
  const [barmanStockTab, setBarmanStockTab] = useState('available');

  // --- Data Loading Callbacks ---

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchRequests();
      if (Array.isArray(data)) {
        setRequests(data);
      } else if (data && Array.isArray(data.results)) {
        setRequests(data.results);
      } else {
        console.warn("API returned unexpected format for requests:", data);
        setRequests([]);
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      setErrorMessage(t('error_loading_requests') + ": " + (err.response?.data?.detail || err.message || t('network_error')));
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadProductsAndBranches = useCallback(async () => {
    try {
      const productsData = await fetchProducts();
      const branchesData = await fetchBranches();
      setProductsForNewRequest(Array.isArray(productsData) ? productsData : productsData.results || []);
      setBranchesForNewRequest(Array.isArray(branchesData) ? branchesData : branchesData.results || []);
    } catch (err) {
      console.error(t('error_loading_form_data'), err);
    }
  }, [t]);

  const loadBarmanStocks = useCallback(async () => {
    setBarmanStockLoading(true);
    setBarmanStockError(null);
    try {
      // getBarmanStock now takes no arguments, as it filters by authenticated user on backend
      const data = await getBarmanStock();
      if (Array.isArray(data)) {
        setBarmanStocks(data);
      } else if (data && Array.isArray(data.results)) {
        setBarmanStocks(data.results);
      } else {
        console.warn("API returned unexpected format for barman stocks:", data);
        setBarmanStocks([]);
      }
    } catch (err) {
      console.error('Error fetching barman stocks:', err);
      setBarmanStockError(t('error_loading_barman_stocks') + ": " + (err.response?.data?.detail || err.message || t('network_error')));
      setBarmanStocks([]);
    } finally {
      setBarmanStockLoading(false);
    }
  }, [t]);


  // --- Effects ---
  useEffect(() => {
    loadRequests();
    loadProductsAndBranches();
  }, [loadRequests, loadProductsAndBranches]);

  useEffect(() => {
    loadBarmanStocks();
  }, [loadBarmanStocks]);


  // --- Handlers for New Request component ---

  const handleNewRequestSuccess = useCallback(async () => {
    // NewRequest handles its own success message internally.
    setShowNewRequestModal(false); // Close the modal
    await loadRequests(); // Reload the list of requests
    // No need to reload barman stocks directly on request submission unless
    // a successful request immediately impacts current stock (unlikely for 'pending' status)
    alert(t('request_submitted_successfully_alert')); // Optional: show a quick alert
  }, [t, loadRequests]);

  const handleNewRequestError = useCallback((message) => {
    // NewRequest already displays the message internally.
    // This callback can be used for global notifications or further logging if needed.
    console.error("Error from NewRequest form:", message);
  }, []);

  const filteredRequests = requests.filter(
    (req) =>
      (user && String(req.requesting_branch?.id || req.branch) === String(branchId)) // Note: 'branch_id' might just be 'branch'
  );

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">{t('my_bar_stock')}</h2>
      {barmanStockLoading ? (
        <p className="text-center py-4">{t('loading_barman_stocks')}...</p>
      ) : barmanStockError ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">{t('error')}:</strong>
          <span className="block sm:inline"> {barmanStockError}</span>
          <button onClick={loadBarmanStocks} className="ml-4 text-sm font-semibold underline">{t('retry')}</button>
        </div>
      ) : (
        <BarmanStockStatus
          stocks={barmanStocks}
          tab={barmanStockTab}
          setTab={setBarmanStockTab}
          bartenderId={bartenderId}
        />
      )}

      <div className="flex items-center justify-between mb-4 mt-8">
        <h1 className="text-2xl font-bold">{t('inventory_request_history')}</h1>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          onClick={() => {
            setShowNewRequestModal(true);
          }}
        >
          {t('new_request_button')}
        </button>
      </div>

      {showNewRequestModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full m-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{t('create_new_inventory_request')}</h2>
              <button onClick={() => setShowNewRequestModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            {/* NewRequest component handles its own messages internally */}
            <NewRequest
              products={productsForNewRequest}
              branches={branchesForNewRequest}
              onSuccess={handleNewRequestSuccess}
              onError={handleNewRequestError}
              initialBranchId={branchId}
              show={true} // Explicitly tell NewRequest it's being shown
              onClose={() => setShowNewRequestModal(false)} // Pass the close handler
            />
          </div>
        </div>
      )}


      {loading ? (
        <p className="text-center py-4">{t('loading_requests')}...</p>
      ) : errorMessage ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">{t('error')}:</strong>
          <span className="block sm:inline"> {errorMessage}</span>
          <button onClick={loadRequests} className="ml-4 text-sm font-semibold underline">{t('retry')}</button>
        </div>
      ) : filteredRequests.length === 0 ? (
        <p className="text-gray-600 italic text-center py-4">{t('no_requests_found_for_branch')}</p>
      ) : (
        <div className="overflow-x-auto shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('product')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('category')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('item_type')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('quantity')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('unit_type')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('requested_by')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('requested_at')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-100 transition duration-150 ease-in-out">
                  <td className="px-6 py-4 whitespace-nowrap">{req.product?.name || t('na')}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{req.product?.category?.category_name || t('na')}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{req.product?.category?.item_type?.type_name || t('na')}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{req.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{req.unit_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{req.requested_by?.username || t('na')}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(req.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        req.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : req.status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : req.status === 'rejected' // Explicitly handle 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800' // Default if status is unknown
                      }`}
                    >
                      {t(req.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {/* Actions are now simplified: a request is either accepted/rejected by HQ.
                        If a "mark as delivered/reached" action is needed by the barman,
                        it must be a separate API call defined on the backend.
                        For now, display status. */}
                    {req.status === 'accepted' ? (
                      req.reached_status ? ( // Assuming `reached_status` is a boolean field
                        <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                          {t('marked_as_delivered')}
                        </span>
                      ) : (
                        <span className="text-gray-500 italic">
                            {t('pending_delivery_confirmation')} {/* Or "Awaiting delivery" */}
                        </span>
                        // If you need a button here to update `reached_status`, you'll need a new API endpoint.
                      )
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