import React from 'react';
import { useCart } from '../../../context/CartContext';
import { MdModeEdit, MdPrint, MdRedo, MdDelete } from 'react-icons/md';
import './OrderPage.css'; // We'll keep the same CSS for now and adjust it

const OrderDetail = ({ orderData, onEdit }) => {
  const { cartItems } = useCart(); // Only need cartItems here if orderData is null

  // itemsToDisplay will be orderData.items if an order is selected, otherwise cartItems
  const itemsToDisplay = orderData && orderData.items ? orderData.items : cartItems;

  // Always calculate subtotal and total based on itemsToDisplay
  const calculatedSubtotal = itemsToDisplay.reduce((total, item) => total + (item.price * item.quantity), 0);
  const calculatedTotal = (calculatedSubtotal * 1.1).toFixed(2); // Assuming 10% service charge

  return (
    <div className="order-detail-container">
      <div className="order-detail-header">
        <h2>Order {orderData ? orderData.orderId : '2023-XX-XX'}</h2>
        <div className="order-actions-buttons">
          <MdModeEdit size={24} className="header-icon" onClick={() => onEdit(orderData)} />
          <MdPrint size={24} className="header-icon" />
          <MdRedo size={24} className="header-icon" />
          <MdDelete size={24} className="header-icon" />
        </div>
      </div>

      <div className="order-items-table">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Dish</th>
              <th>Qty</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {itemsToDisplay.map((item, index) => (
              <tr key={index}>
                <td>{item.category || 'Main'}</td> {/* Placeholder for Type, assuming 'Main' if not specified */}
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="price-note">All prices are in USD, tips are appreciated.</p>

      <div className="order-summary-footer">
        <div className="summary-line">
          <span>Subtotal</span>
          <span>${calculatedSubtotal.toFixed(2)}</span>
        </div>
        <div className="summary-line total">
          <span>Total</span>
          <span>${calculatedTotal}</span>
        </div>
      </div>

      {/* Remove Print/Complete buttons from here, they are not in the new UI for this pane */}

    </div>
  );
};

export default OrderDetail; 