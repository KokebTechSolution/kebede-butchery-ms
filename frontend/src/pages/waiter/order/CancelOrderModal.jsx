import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Trash2, AlertCircle } from 'lucide-react';
import { deleteOrder } from '../../../api/waiterApi';
import { safeFormatPrice } from '../../../utils/priceUtils';
import './CancelOrderModal.css';

const CancelOrderModal = ({ isOpen, onClose, order, onOrderCancelled }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');

  const handleCancelOrder = async () => {
    if (!cancellationReason.trim()) {
      setError('Please provide a reason for cancellation');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await deleteOrder(order.id);
      
      // Call the callback to refresh the parent component
      if (onOrderCancelled) {
        onOrderCancelled(order.id);
      }

      // Close modal after successful cancellation
      onClose();
      
    } catch (error) {
      console.error('Error cancelling order:', error);
      setError(error.response?.data?.error || 'Failed to cancel order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return; // Prevent closing while processing
    setCancellationReason('');
    setError('');
    onClose();
  };

  if (!isOpen || !order) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="cancel-order-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className="cancel-order-modal"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="modal-header">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h2 className="text-xl font-bold text-gray-800">
                Cancel Order #{order.order_number}
              </h2>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="close-button"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Warning Message */}
          <div className="warning-message">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-800">Warning: This action cannot be undone!</p>
              <p className="text-red-700 text-sm mt-1">
                Cancelling this order will permanently remove it from the system.
              </p>
            </div>
          </div>

          {/* Order Info */}
          <div className="order-info">
            <div className="info-row">
              <span className="label">Table:</span>
              <span className="value">Table {order.table_number}</span>
            </div>
            <div className="info-row">
              <span className="label">Items:</span>
              <span className="value">{order.items?.length || 0} items</span>
            </div>
            <div className="info-row">
              <span className="label">Total Amount:</span>
              <span className="value">
                {order.total_money && !isNaN(Number(order.total_money)) 
                  ? safeFormatPrice(order.total_money)
                  : order.items && order.items.length > 0
                    ? safeFormatPrice(order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0))
                    : safeFormatPrice(0)
                }
              </span>
            </div>
            <div className="info-row">
              <span className="label">Status:</span>
              <span className={`status-badge ${order.cashier_status}`}>
                {order.cashier_status === 'printed' ? 'Printed' : 'Pending'}
              </span>
            </div>
          </div>

          {/* Cancellation Reason */}
          <div className="reason-section">
            <label className="reason-label">
              Cancellation Reason <span className="required">*</span>
            </label>
            <select
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              disabled={loading}
              className="reason-select"
            >
              <option value="">Select a reason</option>
              <option value="customer-request">Customer Request</option>
              <option value="out-of-stock">Out of Stock</option>
              <option value="kitchen-issue">Kitchen Issue</option>
              <option value="payment-issue">Payment Issue</option>
              <option value="duplicate-order">Duplicate Order</option>
              <option value="other">Other</option>
            </select>
            
            {cancellationReason === 'other' && (
              <input
                type="text"
                placeholder="Please specify the reason"
                value={cancellationReason === 'other' ? '' : ''}
                onChange={(e) => setCancellationReason(e.target.value)}
                disabled={loading}
                className="custom-reason-input"
              />
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer */}
          <div className="modal-footer">
            <button
              onClick={handleClose}
              disabled={loading}
              className="cancel-button"
            >
              Keep Order
            </button>
            
            <button
              onClick={handleCancelOrder}
              disabled={loading || !cancellationReason.trim()}
              className="confirm-cancel-button"
            >
              {loading ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  <span>Cancelling...</span>
                </div>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Cancel Order</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CancelOrderModal;
