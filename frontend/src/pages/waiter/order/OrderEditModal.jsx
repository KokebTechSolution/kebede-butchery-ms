import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTimes, FaPlus, FaMinus, FaSave, FaTrash } from 'react-icons/fa';
import axiosInstance from '../../../api/axiosInstance';
import './OrderEditModal.css';

const OrderEditModal = ({ 
  isOpen, 
  onClose, 
  currentOrder, 
  onOrderUpdated 
}) => {
  const { t } = useTranslation();
  const [editableItems, setEditableItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Initialize editable items when modal opens
  useEffect(() => {
    if (isOpen && currentOrder?.items) {
      // Only allow editing of pending items
      const pendingItems = currentOrder.items
        .filter(item => item.status === 'pending')
        .map(item => ({
          ...item,
          originalQuantity: item.quantity,
          isModified: false
        }));
      setEditableItems(pendingItems);
      setError('');
      setSuccessMessage('');
    }
  }, [isOpen, currentOrder]);

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      // Remove item if quantity is 0 or negative
      setEditableItems(prev => prev.filter(item => item.id !== itemId));
    } else {
      setEditableItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { 
                ...item, 
                quantity: newQuantity, 
                isModified: newQuantity !== item.originalQuantity 
              }
            : item
        )
      );
    }
  };

  const handleRemoveItem = (itemId) => {
    setEditableItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleSaveChanges = async () => {
    if (editableItems.length === 0) {
      setError('Cannot save empty order. Please add at least one item.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Prepare the updated items data
      const updatedItems = editableItems.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        item_type: item.item_type,
        product_id: item.product_id,
        status: 'pending' // Reset to pending for kitchen/bar approval
      }));

      console.log('[OrderEditModal] Sending updated items:', updatedItems);
      console.log('[OrderEditModal] Request payload:', { items: updatedItems, is_edit: true });

      // Update the order with new items
      const response = await axiosInstance.patch(`/orders/${currentOrder.id}/edit-items/`, {
        items: updatedItems,
        is_edit: true
      });

      console.log('[OrderEditModal] Order updated successfully:', response.data);
      setSuccessMessage('Order updated successfully! Kitchen/Bar will be notified of changes.');
      
      // Call the callback to refresh parent component
      if (onOrderUpdated) {
        onOrderUpdated(response.data);
      }

      // Close modal after a short delay to show success message
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      console.error('[OrderEditModal] Error updating order:', error);
      setError('Failed to update order: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Check if there are unsaved changes
    const hasChanges = editableItems.some(item => item.isModified || item.quantity !== item.originalQuantity);
    
    if (hasChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmed) {
        return;
      }
    }
    
    onClose();
  };

  const getTotalPrice = () => {
    return editableItems.reduce((total, item) => {
      return total + (Number(item.price || 0) * item.quantity);
    }, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="order-edit-modal-overlay">
      <div className="order-edit-modal">
        <div className="modal-header">
          <h3>Edit Order #{currentOrder?.id}</h3>
          <button className="close-button" onClick={handleClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-content">
          {error && (
            <div className="error-message">
              <span>❌ {error}</span>
            </div>
          )}

          {successMessage && (
            <div className="success-message">
              <span>✅ {successMessage}</span>
            </div>
          )}

          <div className="edit-instructions">
            <p><strong>Instructions:</strong></p>
            <ul>
              <li>You can modify quantities of pending items</li>
              <li>Set quantity to 0 to remove items</li>
              <li>Items will be sent back to kitchen/bar for approval</li>
              <li>Only pending items can be edited</li>
            </ul>
          </div>

          <div className="editable-items-section">
            <h4>Edit Items</h4>
            {editableItems.length === 0 ? (
              <div className="no-items-message">
                <p>No pending items to edit.</p>
                <p>All items must be accepted by kitchen/bar before they can be edited.</p>
              </div>
            ) : (
              <div className="items-list">
                {editableItems.map((item) => (
                  <div key={item.id} className="editable-item">
                    <div className="item-info">
                      <span className="item-name">{item.name}</span>
                      <span className="item-price">ETB {Number(item.price || 0).toFixed(2)}</span>
                    </div>
                    
                    <div className="item-controls">
                      <div className="quantity-controls">
                        <button
                          className="quantity-btn minus"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={loading}
                        >
                          <FaMinus />
                        </button>
                        
                        <span className="quantity-display">
                          {item.quantity}
                          {item.isModified && <span className="modified-indicator">*</span>}
                        </span>
                        
                        <button
                          className="quantity-btn plus"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          disabled={loading}
                        >
                          <FaPlus />
                        </button>
                      </div>
                      
                      <button
                        className="remove-item-btn"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={loading}
                        title="Remove item"
                      >
                        <FaTrash />
                      </button>
                    </div>
                    
                    <div className="item-total">
                      <strong>Total: ETB {(Number(item.price || 0) * item.quantity).toFixed(2)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {editableItems.length > 0 && (
            <div className="order-summary">
              <div className="summary-row">
                <span>Items Count:</span>
                <span>{editableItems.length}</span>
              </div>
              <div className="summary-row total">
                <span>Total Amount:</span>
                <span>ETB {getTotalPrice().toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="cancel-btn"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </button>
          
          <button
            className="save-btn"
            onClick={handleSaveChanges}
            disabled={loading || editableItems.length === 0}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderEditModal;
