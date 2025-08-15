import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCheck, FaTimes, FaEye, FaClock } from 'react-icons/fa';
import { getPendingUpdates, processOrderUpdate } from '../api/orders';
import './OrderUpdatesDisplay.css';

const OrderUpdatesDisplay = ({ userRole = 'kitchen' }) => {
  const { t } = useTranslation();
  const [pendingUpdates, setPendingUpdates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchPendingUpdates();
    // Poll for new updates every 30 seconds
    const interval = setInterval(fetchPendingUpdates, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingUpdates = async () => {
    try {
      setLoading(true);
      const data = await getPendingUpdates();
      setPendingUpdates(data.pending_updates || []);
    } catch (error) {
      console.error('Failed to fetch pending updates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (update) => {
    setSelectedUpdate(update);
    setShowDetails(true);
    setNotes('');
    setRejectionReason('');
  };

  const handleAccept = async () => {
    if (!selectedUpdate) return;
    
    try {
      setProcessing(true);
      await processOrderUpdate(selectedUpdate.id, 'accept', notes);
      
      // Refresh the list
      await fetchPendingUpdates();
      setShowDetails(false);
      setSelectedUpdate(null);
      setNotes('');
      
      // Show success message
      alert('Order update accepted successfully!');
      
    } catch (error) {
      console.error('Failed to accept update:', error);
      alert('Failed to accept update: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedUpdate || !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    
    try {
      setProcessing(true);
      await processOrderUpdate(selectedUpdate.id, 'reject', '', rejectionReason);
      
      // Refresh the list
      await fetchPendingUpdates();
      setShowDetails(false);
      setSelectedUpdate(null);
      setRejectionReason('');
      
      // Show success message
      alert('Order update rejected successfully!');
      
    } catch (error) {
      console.error('Failed to reject update:', error);
      alert('Failed to reject update: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const getUpdateTypeIcon = (updateType) => {
    switch (updateType) {
      case 'addition':
        return <FaPlus className="update-type-icon addition" />;
      case 'modification':
        return <FaEdit className="update-type-icon modification" />;
      case 'removal':
        return <FaTimes className="update-type-icon removal" />;
      default:
        return <FaClock className="update-type-icon" />;
    }
  };

  const getUpdateTypeLabel = (updateType) => {
    switch (updateType) {
      case 'addition':
        return 'New Items Added';
      case 'modification':
        return 'Items Modified';
      case 'removal':
        return 'Items Removed';
      default:
        return updateType;
    }
  };

  if (loading && pendingUpdates.length === 0) {
    return (
      <div className="order-updates-display">
        <div className="updates-header">
          <h2>🔄 Loading Pending Updates...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="order-updates-display">
      <div className="updates-header">
        <h2>📋 Pending Order Updates</h2>
        <button 
          onClick={fetchPendingUpdates} 
          className="refresh-btn"
          disabled={loading}
        >
          {loading ? '🔄' : '🔄'} Refresh
        </button>
      </div>

      {pendingUpdates.length === 0 ? (
        <div className="no-updates">
          <FaClock className="no-updates-icon" />
          <p>No pending order updates</p>
          <p>All orders are up to date!</p>
        </div>
      ) : (
        <div className="updates-grid">
          {pendingUpdates.map((update) => (
            <div key={update.id} className="update-card pending">
              <div className="update-card-header">
                {getUpdateTypeIcon(update.update_type)}
                <div className="update-info">
                  <h3>Order #{update.original_order}</h3>
                  <span className="update-type-label">
                    {getUpdateTypeLabel(update.update_type)}
                  </span>
                </div>
                <span className="update-time">
                  {new Date(update.created_at).toLocaleTimeString()}
                </span>
              </div>
              
              <div className="update-card-content">
                <div className="update-summary">
                  <p><strong>Cost:</strong> ETB {update.total_addition_cost}</p>
                  {update.notes && <p><strong>Notes:</strong> {update.notes}</p>}
                </div>
                
                <div className="update-actions">
                  <button
                    onClick={() => handleViewDetails(update)}
                    className="btn btn-view"
                    title="View Details"
                  >
                    <FaEye /> Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Update Details Modal */}
      {showDetails && selectedUpdate && (
        <div className="update-details-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Order Update Details</h3>
              <button 
                onClick={() => setShowDetails(false)}
                className="close-btn"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="update-details-content">
                <div className="detail-section">
                  <h4>Order Information</h4>
                  <p><strong>Order ID:</strong> #{selectedUpdate.original_order}</p>
                  <p><strong>Update Type:</strong> {getUpdateTypeLabel(selectedUpdate.update_type)}</p>
                  <p><strong>Created:</strong> {new Date(selectedUpdate.created_at).toLocaleString()}</p>
                  <p><strong>Total Cost:</strong> ETB {selectedUpdate.total_addition_cost}</p>
                </div>

                <div className="detail-section">
                  <h4>Items Changes</h4>
                  <div className="items-changes">
                    {selectedUpdate.update_type === 'addition' && (
                      <div className="addition-items">
                        {selectedUpdate.items_changes.items?.map((item, index) => (
                          <div key={index} className="item-change">
                            <span className="item-name">{item.name}</span>
                            <span className="item-quantity">x{item.quantity}</span>
                            <span className="item-price">ETB {Number(item.price || 0).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {selectedUpdate.update_type === 'modification' && (
                      <div className="modification-items">
                        {selectedUpdate.items_changes.modifications?.map((mod, index) => (
                          <div key={index} className="item-change">
                            <span className="item-id">Item #{mod.item_id}</span>
                            {mod.quantity && <span>Qty: {mod.quantity}</span>}
                            {mod.price && <span>Price: ETB {mod.price}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {selectedUpdate.notes && (
                  <div className="detail-section">
                    <h4>Notes</h4>
                    <p>{selectedUpdate.notes}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <div className="action-inputs">
                <input
                  type="text"
                  placeholder="Add notes (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="notes-input"
                />
                
                {userRole === 'kitchen' && (
                  <input
                    type="text"
                    placeholder="Rejection reason (required for rejection)"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="rejection-input"
                  />
                )}
              </div>
              
              <div className="action-buttons">
                <button
                  onClick={handleAccept}
                  className="btn btn-accept"
                  disabled={processing}
                >
                  <FaCheck /> Accept
                </button>
                
                <button
                  onClick={handleReject}
                  className="btn btn-reject"
                  disabled={processing || !rejectionReason.trim()}
                >
                  <FaTimes /> Reject
                </button>
                
                <button
                  onClick={() => setShowDetails(false)}
                  className="btn btn-cancel"
                  disabled={processing}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderUpdatesDisplay;





