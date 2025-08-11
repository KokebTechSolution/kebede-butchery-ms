import React, { useEffect, useState, useMemo } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useTranslation } from 'react-i18next';
import {
  fetchRequests,
  acceptRequest,
  rejectRequest,
} from '../../api/inventory';
import NewRequest from './NewRequest';
import { useAuth } from '../../context/AuthContext';
import { FaSearch, FaTimes, FaCheck, FaTimes as FaReject, FaEdit, FaTrash, FaClipboardList, FaFilter } from 'react-icons/fa';

const InventoryRequestList = () => {
  const { t } = useTranslation();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Filter requests based on search term and status
  const filteredRequests = useMemo(() => {
    let filtered = requests;
    
    if (searchTerm) {
      filtered = filtered.filter(req => 
        req.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.product?.category?.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.branch?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }
    
    return filtered;
  }, [requests, searchTerm, statusFilter]);

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
      await axiosInstance.post(`inventory/requests/${id}/edit/`, {});
      await loadRequests();
      setFormMessage(t('request_edited'));
    } catch (err) {
      setFormMessage(t('failed_to_edit_request'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (id) => {
    setProcessingId(id);
    try {
      await axiosInstance.post(`inventory/requests/${id}/cancel/`, {});
      await loadRequests();
      setFormMessage(t('request_cancelled'));
    } catch (err) {
      setFormMessage(t('failed_to_cancel_request'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReach = async (id) => {
    setProcessingId(id);
    try {
      await axiosInstance.post(`inventory/requests/${id}/reach/`, {});
      await loadRequests();
      setFormMessage(t('request_reached'));
    } catch (err) {
      setFormMessage(t('failed_to_mark_reached'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleNotReach = async (id) => {
    setProcessingId(id);
    try {
      await axiosInstance.post(`inventory/requests/${id}/not_reach/`, {});
      await loadRequests();
      setFormMessage(t('request_not_reached'));
    } catch (err) {
      setFormMessage(t('failed_to_mark_not_reached'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormMessage('');

    try {
      const response = await axiosInstance.post('inventory/requests/', formData);
      if (response.status === 201) {
        setFormData({
          product: '',
          quantity: '',
          unit_type: 'unit',
          status: 'pending',
          branch: '',
        });
        setFormMessage(t('request_submitted_successfully'));
        await loadRequests();
      }
    } catch (err) {
      const messages = [];
      if (err.response?.data) {
        Object.keys(err.response.data).forEach(key => {
          if (Array.isArray(err.response.data[key])) {
            messages.push(err.response.data[key].join(', '));
          } else {
            messages.push(err.response.data[key]);
          }
        });
      }
      setFormMessage(messages.length > 0 ? messages.join('; ') : t('request_submission_failed'));
    }
  };

  // Render request card for mobile view
  const renderRequestCard = (req) => (
    <div key={req.id} className="bg-white rounded-lg shadow p-4 mb-4 border-l-4 border-blue-500">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-800">{req.product?.name || 'N/A'}</h3>
          <p className="text-gray-600 text-sm mt-1">{req.product?.category?.category_name || 'N/A'}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          req.status === 'pending'
            ? 'bg-yellow-100 text-yellow-800'
            : req.status === 'accepted'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {t(req.status)}
        </span>
      </div>
      
      <div className="space-y-2 text-sm text-gray-700 mb-4">
        <p><span className="font-medium">{t('quantity')}:</span> {req.quantity} {req.unit_type}</p>
        <p><span className="font-medium">{t('branch')}:</span> {req.branch?.name || 'N/A'}</p>
        <p><span className="font-medium">{t('requested_at')}:</span> {new Date(req.created_at).toLocaleString()}</p>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {req.status === 'pending' ? (
          <>
            <button
              onClick={() => handleAccept(req.id)}
              disabled={processingId === req.id}
              className="bg-green-500 text-white px-3 py-2 rounded text-sm flex items-center hover:bg-green-600 disabled:opacity-50"
            >
              <FaCheck className="mr-1" /> {t('accept')}
            </button>
            <button
              onClick={() => handleReject(req.id)}
              disabled={processingId === req.id}
              className="bg-red-500 text-white px-3 py-2 rounded text-sm flex items-center hover:bg-red-600 disabled:opacity-50"
            >
              <FaReject className="mr-1" /> {t('reject')}
            </button>
            {user.role === 'bartender' && req.requested_by === user.id && (
              <>
                <button
                  onClick={() => handleEdit(req.id)}
                  disabled={processingId === req.id}
                  className="bg-yellow-500 text-white px-3 py-2 rounded text-sm flex items-center hover:bg-yellow-600 disabled:opacity-50"
                >
                  <FaEdit className="mr-1" /> {t('edit')}
                </button>
                <button
                  onClick={() => handleCancel(req.id)}
                  disabled={processingId === req.id}
                  className="bg-gray-500 text-white px-3 py-2 rounded text-sm flex items-center hover:bg-gray-600 disabled:opacity-50"
                >
                  <FaTrash className="mr-1" /> {t('cancel')}
                </button>
              </>
            )}
          </>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => handleReach(req.id)}
              disabled={processingId === req.id}
              className="bg-blue-500 text-white px-3 py-2 rounded text-sm flex items-center hover:bg-blue-600 disabled:opacity-50"
            >
              {t('mark_reached')}
            </button>
            <button
              onClick={() => handleNotReach(req.id)}
              disabled={processingId === req.id}
              className="bg-gray-500 text-white px-3 py-2 rounded text-sm flex items-center hover:bg-gray-600 disabled:opacity-50"
            >
              {t('mark_not_reached')}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center">
              <FaClipboardList className="mr-3 text-blue-600" />
              {t('inventory_requests_title')}
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              {filteredRequests.length} {t('requests')}
            </p>
          </div>
          
          {/* Search and Filter Section */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Search Bar */}
            <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t('search_requests')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label={t('search_requests')}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  aria-label={t('clear_search')}
                >
                  <FaTimes className="text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            
            {/* Status Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaFilter className="text-gray-400" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option value="all">{t('all_statuses')}</option>
                <option value="pending">{t('pending')}</option>
                <option value="accepted">{t('accepted')}</option>
                <option value="rejected">{t('rejected')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* New Request Form */}
        <div className="mb-6">
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
        </div>

        {/* Content Section */}
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <FaClipboardList className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              {searchTerm || statusFilter !== 'all' ? t('no_matching_requests') : t('no_requests_found')}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' ? t('try_different_search') : t('no_requests_yet')}
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaClipboardList className="-ml-1 mr-2 h-5 w-5" />
                {t('create_request')}
              </button>
            </div>
          </div>
        ) : isMobile ? (
          // Mobile card view
          <div className="space-y-3">
            {filteredRequests.map(req => renderRequestCard(req))}
          </div>
        ) : (
          // Desktop table view
          <div className="bg-white shadow rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('product')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('category')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('quantity')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('branch')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('requested_at')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('status')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{req.product?.name || t('na')}</div>
                        <div className="text-sm text-gray-500">{req.product?.category?.item_type?.type_name || t('na')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {req.product?.category?.category_name || t('na')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {req.quantity} {req.unit_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {req.branch?.name || t('na')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(req.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          req.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : req.status === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {t(req.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {req.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleAccept(req.id)}
                              disabled={processingId === req.id}
                              className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-3 py-1 rounded text-sm disabled:opacity-50"
                            >
                              {t('accept')}
                            </button>
                            <button
                              onClick={() => handleReject(req.id)}
                              disabled={processingId === req.id}
                              className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1 rounded text-sm disabled:opacity-50"
                            >
                              {t('reject')}
                            </button>
                            {user.role === 'bartender' && req.requested_by === user.id && (
                              <>
                                <button
                                  onClick={() => handleEdit(req.id)}
                                  disabled={processingId === req.id}
                                  className="text-yellow-600 hover:text-yellow-900 bg-yellow-100 hover:bg-yellow-200 px-3 py-1 rounded text-sm disabled:opacity-50"
                                >
                                  {t('edit')}
                                </button>
                                <button
                                  onClick={() => handleCancel(req.id)}
                                  disabled={processingId === req.id}
                                  className="text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-sm disabled:opacity-50"
                                >
                                  {t('cancel')}
                                </button>
                              </>
                            )}
                          </>
                        ) : (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleReach(req.id)}
                              disabled={processingId === req.id}
                              className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded text-sm disabled:opacity-50"
                            >
                              {t('mark_reached')}
                            </button>
                            <button
                              onClick={() => handleNotReach(req.id)}
                              disabled={processingId === req.id}
                              className="text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-sm disabled:opacity-50"
                            >
                              {t('mark_not_reached')}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryRequestList;
