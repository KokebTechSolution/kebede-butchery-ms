import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar.jsx';
import TablesPage, { tables } from './tables/TablesPage.jsx';
import MenuPage from './menu/MenuPage.jsx';
import Cart from '../../components/Cart/Cart.jsx';
import { CartProvider, useCart } from '../../context/CartContext.jsx';
import OrderDetails from './order/OrderDetails.jsx';
import OrderList from './order/OrderList.jsx';
import './App.css';

// Payment Method Modal Component
const PaymentMethodModal = ({ isOpen, onClose, onConfirm, selectedMethod, onMethodChange }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>
        <div className="space-y-3 mb-6">
          <label className="flex items-center space-x-3">
            <input
              type="radio"
              name="paymentMethod"
              value="cash"
              checked={selectedMethod === 'cash'}
              onChange={(e) => onMethodChange(e.target.value)}
              className="text-blue-600"
            />
            <span>💵 Cash</span>
          </label>
          <label className="flex items-center space-x-3">
            <input
              type="radio"
              name="paymentMethod"
              value="online"
              checked={selectedMethod === 'online'}
              onChange={(e) => onMethodChange(e.target.value)}
              className="text-blue-600"
            />
            <span>💳 Online Payment</span>
          </label>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!selectedMethod}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            Confirm Order
          </button>
        </div>
      </div>
    </div>
  );
};

// New component to encapsulate logic that uses CartContext
const MainAppLogic = ({ currentPage, setCurrentPage, selectedTable, setSelectedTable }) => {
  const [message, setMessage] = useState(''); // State for messages
  const [selectedOrderId, setSelectedOrderId] = useState(null); // New state for selected order
  const [editingOrderId, setEditingOrderId] = useState(null); // State to track order being edited
  const [showPaymentModal, setShowPaymentModal] = useState(false); // Payment method modal
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash'); // Default payment method
  const [isPlacingOrder, setIsPlacingOrder] = useState(false); // Loading state for order placement

  const { 
    activeTableId, 
    setActiveTable, 
    placeOrder, 
    cartItems, 
    loadCartForEditing, 
    updateOrder, 
    deleteOrder, 
    clearCart 
  } = useCart();

  useEffect(() => {
    // No specific effect for current page or stored order ID needed here yet
  }, []);

  const handleNavigate = (page) => {
    if (page === 'tables' || page === 'menu') {
      setSelectedOrderId(null); // Clear selected order when navigating away from order details
      setEditingOrderId(null); // Clear editing order when navigating away from menu/order details
    }
    setCurrentPage(page);
    if (page === 'tables') {
      setSelectedTable(null);
    }
  };

  const handleTableSelect = (table) => {
    setSelectedTable(table);
    setActiveTable(table.id); // Explicitly set active table in context
    setCurrentPage('menu');
    setMessage(''); // Clear message on table selection
    setSelectedOrderId(null); // Ensure no order is pre-selected when selecting a new table
    setEditingOrderId(null); // Clear editing order when selecting a new table
  };

  const handleOrder = () => {
    if (!activeTableId) {
      setMessage('Please select a table first to place an order.');
      setCurrentPage('tables');
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      setMessage('Your cart is empty. Please add items before placing an order.');
      setCurrentPage('menu');
      return;
    }

    // Show payment method selection modal
    setShowPaymentModal(true);
  };

  const handlePaymentMethodConfirm = async () => {
    if (!selectedPaymentMethod) {
      setMessage('Please select a payment method.');
      return;
    }

    setShowPaymentModal(false);
    setIsPlacingOrder(true);

    try {
      if (editingOrderId) {
        // Update existing order
        setMessage('📝 Updating your order... Please wait!');
        
        const result = await updateOrder(editingOrderId, cartItems);
        console.log('Order update result:', result);
        
        setMessage(`✅ Order updated successfully! Order #${editingOrderId} has been updated.`);
        
        // Clear edit mode
        setEditingOrderId(null);
        
        // Clear the cart after successful update
        clearCart();
        
        // Navigate back to tables
        setTimeout(() => {
          setCurrentPage('tables');
          setSelectedTable(null);
          setMessage('');
        }, 2000);
        
      } else {
        // Place new order
        setMessage('📝 Placing your order... Please wait!');

        const orderData = {
          table: selectedTable.id,
          payment_option: selectedPaymentMethod,
          items: cartItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            item_type: item.item_type || 'food',
            status: 'pending'
          }))
        };

        const newOrderId = await placeOrder(orderData);
        
        if (newOrderId) {
          setMessage(`✅ Great! Order for Table ${selectedTable.number} has been placed successfully!`);
          clearCart();
          
          setTimeout(() => {
            setMessage('');
            setCurrentPage('tables');
            setSelectedTable(null);
          }, 3000);
        } else {
          setMessage('❌ Failed to place order. Please try again.');
        }
      }
    } catch (error) {
      console.error('Order placement error:', error);
      setMessage(`❌ Error: ${error.message || 'Please try again.'}`);
    } finally {
      setIsPlacingOrder(false);
      setTimeout(() => {
        setMessage('');
      }, 5000);
    }
  };

  const handleBackFromMenu = () => {
    setCurrentPage('tables');
    setSelectedTable(null);
    setEditingOrderId(null); // Also clear editing state when going back from menu
  };

  const handleClearCart = () => {
    if (editingOrderId) {
      // If we are editing an existing order and the user clicks 'Clear Cart'
      // it implies they want to discard changes AND remove the original order
      deleteOrder(editingOrderId); // Delete the original order
      setSelectedOrderId(null); // No order is selected anymore
      setEditingOrderId(null); // Reset editing state
      setMessage('Order removed due to cart clear during edit.');
      setCurrentPage('tables'); // Navigate back to tables as the order is gone
    } else {
      // If not editing, just clear the active table's cart
      clearCart();
      setMessage('Cart cleared.');
    }
  };

  const handleEditOrder = (orderToEdit) => {
    if (orderToEdit) {
      loadCartForEditing(orderToEdit.tableId, orderToEdit.items);
      setSelectedTable(tables.find(table => table.id === orderToEdit.tableId)); // Set selected table
      setActiveTable(orderToEdit.tableId); // Ensure active table is set in context
      setEditingOrderId(orderToEdit.id); // Set the order being edited
      setSelectedOrderId(null); // Clear selected order ID as we are now editing the active cart
    }
    setCurrentPage('menu');
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrderId(orderId);
    setEditingOrderId(null); // Clear editing state when selecting a different order
    setCurrentPage('orderDetails');
  };

  const handleOrderDeleted = () => {
    setCurrentPage('tables');
    setSelectedTable(null);
    setActiveTable(null); // Clear active table in context
    setSelectedOrderId(null);
    setEditingOrderId(null);
    setMessage('Order deleted successfully.'); // Optional: show a confirmation message
  };

  return (
    <div className="app-container">
      <Navbar onNavigate={handleNavigate} />
      <div className="main-content white-bg">
        {message && (
          <div className="app-message" style={{ 
            color: message.includes('✅') ? 'green' : message.includes('❌') ? 'red' : 'blue', 
            textAlign: 'center', 
            padding: '10px',
            backgroundColor: message.includes('✅') ? '#f0f9ff' : message.includes('❌') ? '#fef2f2' : '#eff6ff',
            borderRadius: '8px',
            margin: '10px',
            fontWeight: '500'
          }}>
            {message}
          </div>
        )}
        {currentPage === 'tables' && (
          <TablesPage onSelectTable={handleTableSelect} />
        )}
        {currentPage === 'menu' && (
          <div className="menu-cart-container">
            <div className="menu-section">
              <MenuPage table={selectedTable} onBack={handleBackFromMenu} />
            </div>
            <div className="cart-section">
              <Cart 
                onOrder={handleOrder} 
                onClearCart={handleClearCart} 
                editingOrderId={editingOrderId}
                showPaymentSelection={true}
              />
            </div>
          </div>
        )}
        {currentPage === 'orderDetails' && (
          <div className="order-details-layout">
            <OrderList onSelectOrder={handleSelectOrder} selectedOrderId={selectedOrderId} />
            <OrderDetails onEditOrder={handleEditOrder} selectedOrderId={selectedOrderId} onOrderDeleted={handleOrderDeleted} />
          </div>
        )}
      </div>

      {/* Payment Method Modal */}
      <PaymentMethodModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handlePaymentMethodConfirm}
        selectedMethod={selectedPaymentMethod}
        onMethodChange={setSelectedPaymentMethod}
      />

      {/* Loading Overlay */}
      {isPlacingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg font-semibold">Processing Order...</p>
            <p className="text-gray-600">Please wait while we place your order</p>
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  const [currentPage, setCurrentPage] = useState('tables'); // 'tables', 'menu', or 'order'
  const [selectedTable, setSelectedTable] = useState(null);

  return (
    <CartProvider initialActiveTableId={selectedTable ? selectedTable.id : null}>
      <MainAppLogic
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        selectedTable={selectedTable}
        setSelectedTable={setSelectedTable}
      />
    </CartProvider>
  );
}

export default App;
