import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { updateOrder } from '../../../api/waiterApi';
import './EditOrderModal.css';

const EditOrderModal = ({ isOpen, onClose, order, onOrderUpdated }) => {
  const [editedItems, setEditedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (order && order.items) {
      setEditedItems([...order.items]);
    }
  }, [order]);

  const handleQuantityChange = (index, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedItems = [...editedItems];
    updatedItems[index] = { ...updatedItems[index], quantity: newQuantity };
    setEditedItems(updatedItems);
  };

  const handleRemoveItem = (index) => {
    const updatedItems = editedItems.filter((_, i) => i !== index);
    setEditedItems(updatedItems);
  };

  const handleAddItem = () => {
    const newItem = {
      id: `temp-${Date.now()}`,
      name: '',
      quantity: 1,
      price: 0,
      item_type: 'food',
      status: 'pending'
    };
    setEditedItems([...editedItems, newItem]);
  };

  const handleItemNameChange = (index, name) => {
    const updatedItems = [...editedItems];
    updatedItems[index] = { ...updatedItems[index], name };
    setEditedItems(updatedItems);
  };

  const handleItemPriceChange = (index, price) => {
    if (price < 0) return;
    const updatedItems = [...editedItems];
    updatedItems[index] = { ...updatedItems[index], price: parseFloat(price) || 0 };
    setEditedItems(updatedItems);
  };

  const handleItemTypeChange = (index, itemType) => {
    const updatedItems = [...editedItems];
    updatedItems[index] = { ...updatedItems[index], item_type: itemType };
    setEditedItems(updatedItems);
  };

  const calculateTotal = () => {
    return editedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const validateOrder = () => {
    if (editedItems.length === 0) {
      setError('Order must have at least one item');
      return false;
    }

    for (let i = 0; i < editedItems.length; i++) {
      const item = editedItems[i];
      if (!item.name.trim()) {
        setError(`Item ${i + 1} must have a name`);
        return false;
      }
      if (item.quantity < 1) {
        setError(`Item ${i + 1} must have a quantity of at least 1`);
        return false;
      }
      if (item.price < 0) {
        setError(`Item ${i + 1} must have a valid price`);
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateOrder()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const updatedOrder = await updateOrder(order.id, {
        items: editedItems,
        total_money: calculateTotal()
      });

      setSuccess('Order updated successfully!');
      
      // Call the callback to refresh the parent component
      if (onOrderUpdated) {
        onOrderUpdated(updatedOrder);
      }

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Error updating order:', error);
      setError(error.response?.data?.error || 'Failed to update order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return; // Prevent closing while saving
    onClose();
  };

  if (!isOpen || !order) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="edit-order-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className="edit-order-modal"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="modal-header">
            <div className="flex items-center space-x-3">
              <Edit className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-800">
                Edit Order #{order.order_number}
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

          {/* Error/Success Messages */}
          {error && (
            <div className="error-message">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="success-message">
              <CheckCircle className="w-4 h-4" />
              <span>{success}</span>
            </div>
          )}

          {/* Order Info */}
          <div className="order-info">
            <div className="info-row">
              <span className="label">Table:</span>
              <span className="value">Table {order.table_number}</span>
            </div>
            <div className="info-row">
              <span className="label">Status:</span>
              <span className={`status-badge ${order.cashier_status}`}>
                {order.cashier_status === 'printed' ? 'Printed' : 'Pending'}
              </span>
            </div>
            <div className="info-row">
              <span className="label">Payment:</span>
              <span className="value">
                {order.payment_option ? order.payment_option.toUpperCase() : 'Not Selected'}
              </span>
            </div>
          </div>

          {/* Items List */}
          <div className="items-section">
            <div className="section-header">
              <h3 className="text-lg font-semibold text-gray-700">Order Items</h3>
              <button
                onClick={handleAddItem}
                disabled={loading || order.cashier_status === 'printed'}
                className="add-item-button"
              >
                + Add Item
              </button>
            </div>

            <div className="items-list">
              {editedItems.map((item, index) => (
                <div key={item.id || index} className="item-row">
                  <div className="item-inputs">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleItemNameChange(index, e.target.value)}
                      placeholder="Item name"
                      disabled={loading || order.cashier_status === 'printed'}
                      className="item-name-input"
                    />
                    
                    <select
                      value={item.item_type}
                      onChange={(e) => handleItemTypeChange(index, e.target.value)}
                      disabled={loading || order.cashier_status === 'printed'}
                      className="item-type-select"
                    >
                      <option value="food">Food</option>
                      <option value="beverage">Beverage</option>
                      <option value="meat">Meat</option>
                    </select>

                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                      min="1"
                      disabled={loading || order.cashier_status === 'printed'}
                      className="quantity-input"
                    />

                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => handleItemPriceChange(index, e.target.value)}
                      min="0"
                      step="0.01"
                      disabled={loading || order.cashier_status === 'printed'}
                      className="price-input"
                    />

                    <span className="item-total">
                      ETB {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  {order.cashier_status !== 'printed' && (
                    <button
                      onClick={() => handleRemoveItem(index)}
                      disabled={loading}
                      className="remove-item-button"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="order-total">
              <span className="total-label">Total:</span>
              <span className="total-amount">ETB {calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              onClick={handleClose}
              disabled={loading}
              className="cancel-button"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              disabled={loading || order.cashier_status === 'printed'}
              className="save-button"
            >
              {loading ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EditOrderModal;
