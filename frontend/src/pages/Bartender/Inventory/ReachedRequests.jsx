import React, { useEffect, useState } from 'react';
import { fetchRequests, ReachRequest } from '../../../api/inventory';
import { useAuth } from '../../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { FaCheckCircle, FaClock, FaUser, FaCheck } from 'react-icons/fa';

const ReachedRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [message, setMessage] = useState('');

  const { user } = useAuth();
  const branchId = user?.branch;
  const { t } = useTranslation();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await fetchRequests();
      // Filter for accepted requests that haven't been marked as reached
      const acceptedRequests = data.filter(
        req => String(req.branch_id || req.branch?.id) === String(branchId) &&
               req.status === 'accepted' && 
               !req.reached_status
      );
      setRequests(acceptedRequests);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      setMessage('Error loading requests');
    } finally {
      setLoading(false);
    }
  };

  const handleReach = async (id) => {
    setProcessingId(id);
    try {
      await ReachRequest(id);
      setMessage('Request marked as reached!');
      await loadRequests(); // Refresh the list
    } catch (err) {
      setMessage('Failed to mark request as reached.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="text-gray-500 mb-4">
          <FaCheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">All Caught Up!</h3>
          <p className="text-gray-600">No pending inventory requests to mark as reached.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
            <FaCheckCircle className="text-teal-600 text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('mark_as_reached') || 'Mark as Reached'}</h1>
            <p className="text-sm text-gray-500">Acknowledge received inventory requests</p>
          </div>
        </div>
        
        {message && (
          <div className={`px-4 py-2 rounded-lg text-sm ${
            message.includes('Error') || message.includes('Failed') 
              ? 'bg-red-100 text-red-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {requests.map((req) => (
          <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg mb-1">
                    {req.product?.name || 'N/A'}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <FaUser className="w-3 h-3" />
                      <span>{req.branch?.name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FaClock className="w-3 h-3" />
                      <span>{new Date(req.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <span className="px-3 py-1 rounded-full text-sm font-medium border bg-blue-100 text-blue-800 border-blue-200">
                  {t('accepted')}
                </span>
              </div>
              
              {/* Product Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
                <div>
                  <div className="text-gray-500">Category</div>
                  <div className="font-medium">{req.product?.category?.category_name || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Type</div>
                  <div className="font-medium">{req.product?.category?.item_type?.type_name || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Quantity</div>
                  <div className="font-medium">{req.quantity} {req.request_unit?.unit_name || ''}</div>
                </div>
                <div>
                  <div className="text-gray-500">Basic Unit</div>
                  <div className="font-medium">{req.quantity_basic_unit ?? 'N/A'}</div>
                </div>
              </div>

              {/* Reached Button */}
              <div className="flex justify-center">
                <button
                  onClick={() => handleReach(req.id)}
                  disabled={processingId === req.id}
                  className="flex items-center space-x-2 px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <FaCheck className="w-4 h-4" />
                  <span>{t('reached') || 'Reached'}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReachedRequests;
