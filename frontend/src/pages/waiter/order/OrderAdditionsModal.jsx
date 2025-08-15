import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTimes, FaPlus, FaMinus, FaInfoCircle } from 'react-icons/fa';
import './OrderAdditionsModal.css';

const OrderAdditionsModal = ({ 
  isOpen, 
  onClose, 
  currentOrder, 
  onAddItems,
  availableMenuItems = [],
  loading = false
}) => {
  const { t } = useTranslation();
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Reset selected items when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedItems([]);
      setSearchTerm('');
      setSelectedCategory('all');
    }
  }, [isOpen]);

  // Ensure availableMenuItems is always an array
  const safeMenuItems = Array.isArray(availableMenuItems) ? availableMenuItems : [];
  
  // Debug logging to understand the issue
  useEffect(() => {
    console.log('[OrderAdditionsModal] availableMenuItems prop:', availableMenuItems);
    console.log('[OrderAdditionsModal] availableMenuItems type:', typeof availableMenuItems);
    console.log('[OrderAdditionsModal] availableMenuItems isArray:', Array.isArray(availableMenuItems));
    console.log('[OrderAdditionsModal] safeMenuItems:', safeMenuItems);
    console.log('[OrderAdditionsModal] safeMenuItems length:', safeMenuItems.length);
  }, [availableMenuItems, safeMenuItems]);

  // Get unique categories from available menu items
  const categories = ['all', ...new Set(safeMenuItems.map(item => item.category_name || 'Uncategorized'))];

  // Filter menu items based on search and category
  const filteredMenuItems = safeMenuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category_name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddItem = (menuItem) => {
    const existingItem = selectedItems.find(item => item.id === menuItem.id);
    if (existingItem) {
      setSelectedItems(prev => 
        prev.map(item => 
          item.id === menuItem.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setSelectedItems(prev => [...prev, { ...menuItem, quantity: 1 }]);
    }
  };

  const handleRemoveItem = (itemId) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
    } else {
      setSelectedItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  const handleClose = () => {
    if (selectedItems.length > 0) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmed) {
        return;
      }
    }
    setSelectedItems([]);
    setSearchTerm('');
    setSelectedCategory('all');
    onClose();
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item to add.');
      return;
    }
    
    console.log('[OrderAdditionsModal] Submitting items:', selectedItems);
    console.log('[OrderAdditionsModal] Items with item_type:', selectedItems.map(item => ({
      name: item.name,
      item_type: item.item_type,
      quantity: item.quantity,
      price: item.price
    })));
    
    try {
      await onAddItems(selectedItems);
      // Reset selected items after successful submission
      setSelectedItems([]);
      onClose();
    } catch (error) {
      console.error('Error adding items:', error);
      // Don't reset on error, let user try again
    }
  };

  const getTotalPrice = () => {
    return selectedItems.reduce((total, item) => total + (Number(item.price || 0) * item.quantity), 0);
  };

  if (!isOpen) return null;

  return (
    <div className="order-additions-modal-overlay">
      <div className="order-additions-modal">
        <div className="modal-header">
          <h2>Add Items to Order #{currentOrder?.order_number || currentOrder?.id}</h2>
          <button className="close-button" onClick={handleClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-content">
          {/* Previous Order Items Section */}
          <div className="previous-order-section">
            <div className="section-header">
              <FaInfoCircle className="info-icon" />
              <h3>Current Order Items</h3>
            </div>
            <div className="previous-order-items">
              {currentOrder?.items && currentOrder.items.length > 0 ? (
                <>
                  {/* Accepted Items */}
                  {currentOrder.items.filter(item => item.status === 'accepted').length > 0 && (
                    <div className="status-section accepted">
                      <h4 className="status-title accepted">✅ Accepted Items</h4>
                      {currentOrder.items.filter(item => item.status === 'accepted').map((item, index) => (
                        <div key={`accepted-${index}`} className="previous-order-item accepted">
                          <span className="item-name">{item.name}</span>
                          <span className="item-quantity">x{item.quantity}</span>
                          <span className="item-price">ETB {(Number(item.price || 0) * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pending Items */}
                  {currentOrder.items.filter(item => item.status === 'pending').length > 0 && (
                    <div className="status-section pending">
                      <h4 className="status-title pending">⏳ Pending Items</h4>
                      {currentOrder.items.filter(item => item.status === 'pending').map((item, index) => (
                        <div key={`pending-${index}`} className="previous-order-item pending">
                          <span className="item-name">{item.name}</span>
                          <span className="item-quantity">x{item.quantity}</span>
                          <span className="item-price">ETB {(Number(item.price || 0) * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Rejected Items */}
                  {currentOrder.items.filter(item => item.status === 'rejected').length > 0 && (
                    <div className="status-section rejected">
                      <h4 className="status-title rejected">❌ Rejected Items</h4>
                      {currentOrder.items.filter(item => item.status === 'rejected').map((item, index) => (
                        <div key={`rejected-${index}`} className="previous-order-item rejected">
                          <span className="item-name">{item.name}</span>
                          <span className="item-quantity">x{item.quantity}</span>
                          <span className="item-price">ETB {(Number(item.price || 0) * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="no-items">No items in current order</p>
              )}
            </div>
            <div className="previous-order-total">
              <div className="total-breakdown">
                <div className="total-line">
                  <span>Accepted Items Total: ETB {
                    currentOrder?.items ? 
                    currentOrder.items
                      .filter(item => item.status === 'accepted')
                      .reduce((total, item) => total + (Number(item.price || 0) * item.quantity), 0)
                      .toFixed(2) 
                    : '0.00'
                  }</span>
                </div>
                <div className="total-line">
                  <span>Pending Items Total: ETB {
                    currentOrder?.items ? 
                    currentOrder.items
                      .filter(item => item.status === 'pending')
                      .reduce((total, item) => total + (Number(item.price || 0) * item.quantity), 0)
                      .toFixed(2) 
                    : '0.00'
                  }</span>
                </div>
                <div className="total-line grand-total">
                  <strong>Total Order Value: ETB {
                    currentOrder?.items ? 
                    currentOrder.items
                      .filter(item => ['accepted', 'pending'].includes(item.status))
                      .reduce((total, item) => total + (Number(item.price || 0) * item.quantity), 0)
                      .toFixed(2) 
                    : '0.00'
                  }</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="section-divider">
            <span>Add New Items Below</span>
          </div>

          {/* Search and Filter */}
          <div className="search-filter-section">
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>

          {/* Menu Items Grid */}
          <div className="menu-items-grid">
            {loading ? (
              <div className="loading-state">
                <p>Loading menu items...</p>
              </div>
            ) : safeMenuItems.length === 0 ? (
              <div className="no-items-state">
                <p>No menu items available</p>
              </div>
            ) : (
              filteredMenuItems.map(menuItem => (
                <div key={menuItem.id} className="menu-item-card">
                  <div className="menu-item-info">
                    <h4>{menuItem.name}</h4>
                    <p className="menu-item-category">{menuItem.category_name || 'Uncategorized'}</p>
                    <p className="menu-item-price">ETB {Number(menuItem.price || 0).toFixed(2)}</p>
                  </div>
                  <button
                    className="add-item-button"
                    onClick={() => handleAddItem(menuItem)}
                  >
                    <FaPlus />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* No Items Selected Message */}
          {!loading && safeMenuItems.length > 0 && selectedItems.length === 0 && (
            <div className="no-selection-message">
              <p>💡 Click the <FaPlus /> button on any menu item above to add it to your order</p>
            </div>
          )}

          {/* Selected Items */}
          {selectedItems.length > 0 && (
            <div className="selected-items-section">
              <div className="section-header">
                <h3>Items to Add:</h3>
                <small className="reset-note">(This section resets after each addition)</small>
              </div>
              <div className="selected-items-list">
                {selectedItems.map(item => (
                  <div key={item.id} className="selected-item">
                    <div className="item-info">
                      <span className="item-name">{item.name}</span>
                      <span className="item-price">ETB {(Number(item.price || 0) * item.quantity).toFixed(2)}</span>
                    </div>
                    <div className="quantity-controls">
                      <button
                        className="quantity-btn"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      >
                        <FaMinus />
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button
                        className="quantity-btn"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      >
                        <FaPlus />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="total-section">
                <strong>Total Addition: ETB {getTotalPrice().toFixed(2)}</strong>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="cancel-button" onClick={handleClose}>
            Cancel
          </button>
          <button 
            className="submit-button" 
            onClick={handleSubmit}
            disabled={selectedItems.length === 0}
          >
            Add Items to Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderAdditionsModal;
