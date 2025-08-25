import React, { useEffect, useState } from 'react';
import {
  fetchRequests,
  ReachRequest,
  cancelRequest,
  updateRequest,
  fetchProductMeasurements,
} from '../../../api/inventory';
import api from '../../../api/axiosInstance';
import NewRequest from './NewRequest';
import { useAuth } from '../../../context/AuthContext';
import { useTranslation } from 'react-i18next';

const InventoryRequestList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [tab, setTab] = useState('main');
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [bartenderInventory, setBartenderInventory] = useState([]);
  const [formMessage, setFormMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshingMainStock, setRefreshingMainStock] = useState(false);
  const [refreshingBartenderInventory, setRefreshingBartenderInventory] = useState(false);
  const [refreshingRequests, setRefreshingRequests] = useState(false);
  const [defaultMeasurement, setDefaultMeasurement] = useState(null);
  
  const { user } = useAuth();
  const branchId = user?.branch;
  const bartenderId = user?.id;
  const isBartender = user?.role === 'bartender';

  const [formData, setFormData] = useState({
    product: '',
    quantity: '',
    status: 'pending',
    branch: branchId || '',
  });

  useEffect(() => {
    loadRequests();
    loadProducts();
    loadBranches();
    fetchMainStocks();
    if (isBartender) {
      fetchBartenderInventory();
    }
  }, []);

  useEffect(() => {
    if (branchId && !formData.branch) {
      setFormData(prev => ({ ...prev, branch: branchId }));
    }
  }, [branchId, formData.branch]);

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

  // Auto-navigate to history tab when request is submitted successfully
  useEffect(() => {
    if (showSuccess) {
      setTab('history');
    }
  }, [showSuccess]);

  const fetchMainStocks = async () => {
    setRefreshingMainStock(true);
    try {
      const res = await api.get('/inventory/stocks/');
      setStocks(res.data);
    } catch (err) {
      console.error('Error fetching main stocks:', err);
    } finally {
      setRefreshingMainStock(false);
    }
  };

  // Fetch actual bartender inventory (BarmanStock records)
  const fetchBartenderInventory = async () => {
    setRefreshingBartenderInventory(true);
    try {
      const res = await api.get('/inventory/barman-stock/');
      setBartenderInventory(res.data);
    } catch (err) {
      console.error('Error fetching bartender inventory:', err);
    } finally {
      setRefreshingBartenderInventory(false);
    }
  };

  // Refresh bartender inventory (call this after inventory reduction)
  const refreshBartenderInventory = async () => {
    if (isBartender) {
      await fetchBartenderInventory();
    }
  };

  const loadRequests = async () => {
    setLoading(true);
    setRefreshingRequests(true);
    try {
      const data = await fetchRequests();
      setRequests(data);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      alert('Error loading requests');
    } finally {
      setLoading(false);
      setRefreshingRequests(false);
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

  const handleReach = async (id) => {
    setProcessingId(id);
    try {
      await ReachRequest(id);
      await loadRequests();
      setFormMessage('Marked as reached!');
    } catch (err) {
      setFormMessage('Failed to mark as reached.');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          {tab === 'main' ? 'Main Stock' : tab === 'mystore' ? 'My Store' : tab === 'history' ? 'History Request' : 'Inventory Requests'}
        </h1>
        {isBartender && tab === 'main' && (
          <button
            className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium w-full sm:w-auto"
            onClick={() => {
              setFormMessage('');
              setShowModal(true);
            }}
          >
            + Request from Main Stock
          </button>
        )}
      </div>

      {/* Success Banner */}
      {showSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                {formMessage}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => {
                  setShowSuccess(false);
                  setFormMessage('');
                }}
                className="inline-flex bg-green-50 rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      {isBartender && (
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setTab('main')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  tab === 'main'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Main Stock
              </button>
              <button
                onClick={() => setTab('mystore')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  tab === 'mystore'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Store
              </button>
              <button
                onClick={() => setTab('history')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  tab === 'history'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                History Request
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main Stock Tab */}
       {tab === 'main' && (
             <div className="mb-8">
               <div className="flex items-center justify-between mb-4">
                 <h2 className="text-xl font-semibold text-gray-800">Available Products from Main Store</h2>
                 <button
                   onClick={fetchMainStocks}
                   disabled={refreshingMainStock}
                   className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                   title="Refresh main stock"
                 >
                   {refreshingMainStock ? (
                     <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                   ) : (
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                     </svg>
                   )}
                   <span className="text-sm font-medium">{refreshingMainStock ? 'Refreshing...' : 'Refresh'}</span>
                 </button>
               </div>
         
             {/* Mobile Card View */}
             <div className="block md:hidden space-y-3">
               {stocks.length > 0 ? (
                 stocks.map((stock) => (
                   <div key={stock.id} className="bg-white border rounded-lg p-4 shadow-sm">
                     <div className="flex justify-between items-start mb-3">
                       <div className="flex-1">
                         <h3 className="font-semibold text-gray-900 text-sm">{stock.product?.name || 'N/A'}</h3>
                         <p className="text-xs text-gray-600">{stock.product?.category?.category_name || 'N/A'}</p>
                         <p className="text-xs text-blue-600">{stock.product?.item_type?.type_name || 'N/A'}</p>
                       </div>
                       <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                         (stock.calculated_base_units <= stock.minimum_threshold_base_units) ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                       }`}>
                         {(stock.calculated_base_units <= stock.minimum_threshold_base_units) ? 'Running Out' : 'In Stock'}
                       </span>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                       <div>
                         <span className="text-gray-500">Base Unit:</span>
                         <p className="font-medium text-blue-600">1 {stock.product?.base_unit?.unit_name || 'N/A'}</p>
                       </div>
                       <div>
                         <span className="text-gray-500">Input Unit:</span>
                         <p className="font-medium text-green-600">1 {stock.product?.input_unit?.unit_name || 'N/A'}</p>
                       </div>
                       <div>
                         <span className="text-gray-500">Input Quantity:</span>
                         <p className="font-medium text-purple-600">{stock.input_quantity || 'N/A'} {stock.product?.input_unit?.unit_name || 'units'}</p>
                       </div>
                       <div>
                         <span className="text-gray-500">Calculated:</span>
                         <p className="font-medium text-orange-600">{stock.calculated_base_units || 'N/A'} {stock.product?.base_unit?.unit_name || 'units'}</p>
                       </div>
                       <div>
                         <span className="text-gray-500">Price:</span>
                         <p className="font-medium">{stock.product?.base_unit_price ? `ETB ${stock.product.base_unit_price}` : 'N/A'}</p>
                       </div>
                       <div>
                         <span className="text-gray-500">Threshold:</span>
                         <p className="font-medium">{(stock.minimum_threshold_base_units ?? 'N/A')} {stock.product?.base_unit?.unit_name || 'units'}</p>
                       </div>
                     </div>

                     <div className="flex gap-2">
                       <button 
                         onClick={() => {
                           setFormData({
                             product: stock.product?.id,
                             quantity: '',
                             status: 'pending',
                             branch: branchId || '',
                             request_unit_id: stock.product?.input_unit?.id || ''
                           });
                           setShowModal(true);
                         }}
                         className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded text-xs hover:bg-indigo-700"
                       >
                         Request
                       </button>
                     </div>
                   </div>
                 ))
               ) : (
                 <div className="text-center text-gray-500 py-8">
                   No products found
                 </div>
               )}
             </div>

             {/* Desktop Table View */}
             <div className="hidden md:block overflow-x-auto border rounded-lg">
               <table className="min-w-full border-collapse">
                 <thead className="bg-gray-100">
                   <tr>
                     <th className="border px-4 py-2 text-sm">Item Type</th>
                     <th className="border px-4 py-2 text-sm">Name</th>
                     <th className="border px-4 py-2 text-sm">Category</th>
                     <th className="border px-4 py-2 text-sm">Base Unit</th>
                     <th className="border px-4 py-2 text-sm">Base Unit Price</th>
                     <th className="border px-4 py-2 text-sm">Input Unit</th>
                     <th className="border px-4 py-2 text-sm">Input Quantity</th>
                     <th className="border px-4 py-2 text-sm">Calculated Base Units</th>
                     <th className="border px-4 py-2 text-sm">Minimum Threshold</th>
                     <th className="border px-4 py-2 text-sm">Branch</th>
                     <th className="border px-4 py-2 text-sm">Action</th>
                   </tr>
                 </thead>
                 <tbody>
                   {stocks.length > 0 ? (
                     stocks.map((stock) => (
                       <tr key={stock.id} className="text-center hover:bg-gray-50">
                         <td className="border px-4 py-2 text-sm">{stock.product?.item_type?.type_name || 'N/A'}</td>
                         <td className="border px-4 py-2 text-sm">{stock.product?.name || 'N/A'}</td>
                         <td className="border px-4 py-2 text-sm">{stock.product?.category?.category_name || 'N/A'}</td>
                         <td className="border px-4 py-2 text-sm">
                           <div className="text-center">
                             <div className="font-medium text-blue-600">1 {stock.product?.base_unit?.unit_name || 'N/A'}</div>
                             <div className="text-xs text-blue-500">(Base Unit)</div>
                           </div>
                         </td>
                         <td className="border px-4 py-2 text-sm">
                           {stock.product?.base_unit_price ? `ETB ${stock.product.base_unit_price}` : 'N/A'}
                         </td>
                         <td className="border px-4 py-2 text-sm">
                           <div className="text-center">
                             <div className="font-medium text-green-600">1 {stock.product?.input_unit?.unit_name || 'N/A'}</div>
                             <div className="text-xs text-green-500">(Input Unit)</div>
                           </div>
                         </td>
                         <td className="border px-4 py-2 text-sm">
                           <div className="text-center">
                             <div className="font-medium text-purple-600">{stock.input_quantity || 'N/A'} {stock.product?.input_unit?.unit_name || 'units'}</div>
                             <div className="text-xs text-purple-500">(Input Quantity)</div>
                           </div>
                         </td>
                         <td className="border px-4 py-2 text-sm">
                           <div className="text-center">
                             <div className="font-medium text-orange-600">{stock.calculated_base_units || 'N/A'} {stock.product?.base_unit?.unit_name || 'units'}</div>
                             <div className="text-xs text-orange-500">(Calculated)</div>
                           </div>
                         </td>
                         <td className="border px-4 py-2 text-sm">
                           <div className="text-center">
                             <div className="font-medium">{(stock.minimum_threshold_base_units ?? 'N/A')}</div>
                             <div className="text-xs text-gray-600">{stock.product?.base_unit?.unit_name || 'units'}</div>
                           </div>
                         </td>
                         <td className="border px-4 py-2 text-sm">{stock.branch?.name || 'N/A'}</td>
                         <td className="border px-4 py-2">
                           <button 
                             onClick={() => {
                               setFormData({
                                 product: stock.product?.id,
                                 quantity: '',
                                 status: 'pending',
                                 branch: branchId || '',
                                 request_unit_id: stock.product?.input_unit?.id || ''
                               });
                               setShowModal(true);
                             }}
                             className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
                           >
                             Request
                           </button>
                         </td>
                       </tr>
                     ))
                   ) : (
                     <tr>
                       <td colSpan="11" className="border px-4 py-4 text-center text-gray-500">
                         No products found
                       </td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
           </div>
               )}

      {/* My Store Tab */}
      {tab === 'mystore' && (
            <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">My Current Store Inventory (Items Marked as Reached)</h2>
            <button
              onClick={fetchBartenderInventory}
              disabled={refreshingBartenderInventory}
              className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh inventory"
            >
              {refreshingBartenderInventory ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              <span className="text-sm font-medium">{refreshingBartenderInventory ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
          
          {/* Mobile Card View for My Store */}
          <div className="block md:hidden space-y-3">
            {bartenderInventory.length > 0 ? (
              bartenderInventory.map(stock => (
                <div key={stock.id} className="bg-white border rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{stock.stock?.product?.name || 'N/A'}</h3>
                      <p className="text-xs text-gray-600">{stock.stock?.product?.category?.category_name || 'N/A'}</p>
                      <p className="text-xs text-blue-600">{stock.stock?.product?.item_type?.type_name || 'N/A'}</p>
                        </div>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          In Stock
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                        <div>
                      <span className="text-gray-500">Quantity:</span>
                      <p className="font-medium text-purple-600">{stock.original_quantity || stock.quantity_in_base_units} {stock.original_unit?.unit_name || stock.stock?.product?.base_unit?.unit_name || 'units'}</p>
                        </div>
                        <div>
                      <span className="text-gray-500">Basic Units:</span>
                      <p className="font-medium text-orange-600">{stock.quantity_in_base_units} {stock.stock?.product?.base_unit?.unit_name || 'units'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Price:</span>
                      <p className="font-medium">{stock.stock?.product?.base_unit_price ? `ETB ${stock.stock.product.base_unit_price}` : 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Branch:</span>
                      <p className="font-medium">{stock.branch?.name || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-sm">No items in your store yet</p>
                    <p className="text-xs text-gray-400 mt-1">Items will appear here after you mark requests as "reached"</p>
                </div>
                  </div>
                )}
              </div>

          {/* Desktop Table View for My Store */}
          <div className="hidden md:block overflow-x-auto border rounded-lg">
                <table className="min-w-full border-collapse">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-4 py-2 text-sm">Item Type</th>
                      <th className="border px-4 py-2 text-sm">Name</th>
                      <th className="border px-4 py-2 text-sm">Category</th>
                  <th className="border px-4 py-2 text-sm">Quantity</th>
                  <th className="border px-4 py-2 text-sm">Basic Units</th>
                  <th className="border px-4 py-2 text-sm">Unit</th>
                      <th className="border px-4 py-2 text-sm">Price</th>
                      <th className="border px-4 py-2 text-sm">Branch</th>
                    </tr>
                  </thead>
                  <tbody>
                {bartenderInventory.length > 0 ? (
                  bartenderInventory.map(stock => (
                    <tr key={stock.id} className="text-center hover:bg-gray-50">
                      <td className="border px-4 py-2 text-sm">{stock.stock?.product?.item_type?.type_name || 'N/A'}</td>
                      <td className="border px-4 py-2 text-sm">{stock.stock?.product?.name || 'N/A'}</td>
                      <td className="border px-4 py-2 text-sm">{stock.stock?.product?.category?.category_name || 'N/A'}</td>
                          <td className="border px-4 py-2 text-sm">
                            <div className="text-center">
                          <div className="font-medium text-purple-600">{stock.original_quantity || stock.quantity_in_base_units}</div>
                          <div className="text-xs text-purple-500">(Available)</div>
                            </div>
                          </td>
                          <td className="border px-4 py-2 text-sm">
                            <div className="text-center">
                          <div className="font-medium text-orange-600">{stock.quantity_in_base_units}</div>
                          <div className="text-xs text-orange-500">(Base Units)</div>
                            </div>
                          </td>
                      <td className="border px-4 py-2 text-sm">{stock.original_unit?.unit_name || stock.stock?.product?.base_unit?.unit_name || 'N/A'}</td>
                          <td className="border px-4 py-2 text-sm">
                        {stock.stock?.product?.base_unit_price ? `ETB ${stock.stock.product.base_unit_price}` : 'N/A'}
                          </td>
                      <td className="border px-4 py-2 text-sm">{stock.branch?.name || 'N/A'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                    <td colSpan="8" className="border px-4 py-4 text-center text-gray-500">
                      <div className="bg-gray-50 rounded-lg p-6">
                        <p className="text-sm">No items in your store yet</p>
                            <p className="text-xs text-gray-400 mt-1">Items will appear here after you mark requests as "reached"</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
        )}

      {/* History Tab */}
        {tab === 'history' && (
           <div className="mb-8">
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-xl font-semibold text-gray-800">History of All My Requests</h2>
               <button
                 onClick={loadRequests}
                 disabled={refreshingRequests}
                 className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                 title="Refresh requests"
               >
                 {refreshingRequests ? (
                   <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                 ) : (
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                   </svg>
                 )}
                 <span className="text-sm font-medium">{refreshingRequests ? 'Refreshing...' : 'Refresh'}</span>
               </button>
             </div>
             {/* Mobile Card View for Request History */}
             <div className="block md:hidden space-y-4">
               {filteredRequests.length > 0 ? (
                 filteredRequests.map(req => {
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
                           !(req.status === 'accepted' && isBartender) &&
                           reached && (
                             <span className="px-3 py-2 rounded-lg bg-green-200 text-green-900 font-semibold text-sm">{t('reached')}</span>
                           )}
                         {!canEditOrCancel &&
                           !(req.status === 'accepted' && isBartender) &&
                           !reached && (
                             <span className="text-gray-500 italic text-sm px-3 py-2">{t('no_action_available')}</span>
                           )}
                       </div>
                     </div>
                   );
                 })
               ) : (
                 <div className="text-center text-gray-500 py-8">
                   <div className="bg-gray-50 rounded-lg p-6">
                     <p className="text-gray-600 italic text-lg">{t('no_requests_found_for_branch')}</p>
                   </div>
                 </div>
               )}
             </div>

             {/* Desktop Table View for Request History */}
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
                     {filteredRequests.length > 0 ? (
                       filteredRequests.map(req => {
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
                                 !(req.status === 'accepted' && isBartender) &&
                                 reached && (
                                   <span className="px-2 py-1 rounded bg-green-200 text-green-900 font-semibold">{t('reached')}</span>
                                 )}
                               {!canEditOrCancel &&
                                 !(req.status === 'pending') &&
                                 !(req.status === 'accepted' && isBartender) &&
                                 !reached && (
                                   <span className="text-gray-500 italic">{t('no_action_available')}</span>
                                 )}
                             </td>
                           </tr>
                         );
                       })
                     ) : (
                       <tr>
                         <td colSpan="10" className="border px-4 py-4 text-center text-gray-500">
                           <div className="bg-gray-50 rounded-lg p-6">
                             <p className="text-gray-600 italic text-lg">{t('no_requests_found_for_branch')}</p>
                           </div>
                         </td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>
                         </div>
          </div>
      )}

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

             <NewRequest
         showModal={showModal}
         setShowModal={setShowModal}
         formData={formData}
         formMessage={formMessage}
         products={products}
         branches={branches}
         stocks={stocks}
         submitting={submitting}
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
          
          // Set loading state
          setSubmitting(true);
          
           const selectedProduct = products.find(p => p.id === parseInt(formData.product));
           const selectedStock = stocks.find(s => s.product === parseInt(formData.product));
          
          if (!selectedProduct) {
            setFormMessage('Product not found.');
            return;
          }
          
          const unitId = formData.request_unit_id || selectedProduct.input_unit?.id;
          if (!unitId) {
            setFormMessage('No unit information found for this product.');
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
            
            // Show success message and set success state
            setFormMessage('✅ Request submitted successfully!');
            setShowSuccess(true);
            
            // Reset form
            setFormData({
              product: '',
              quantity: '',
              status: 'pending',
              branch: formData.branch,
              request_unit_id: ''
            });
            
            // Close modal
            setShowModal(false);
            
            // Reload requests
            await loadRequests();
            
            // Reset loading state
            setSubmitting(false);
            
            // Hide success message after 3 seconds
            setTimeout(() => {
              setShowSuccess(false);
              setFormMessage('');
            }, 3000);
            
          } catch (err) {
            // Reset loading state on error
            setSubmitting(false);
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

      {/* Loading and Empty States for History Tab */}
      {tab === 'history' && (
        <>
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
          ) : null}
        </>
      )}
    </div>
  );
};

export default InventoryRequestList;
