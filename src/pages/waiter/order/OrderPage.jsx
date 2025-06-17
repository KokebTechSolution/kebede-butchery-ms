import React from 'react';
import { MdArrowBack, MdAccessTime, MdTableRestaurant, MdPerson } from 'react-icons/md';
import { useCart } from '../../../context/CartContext';
import './OrderPage.css';

const OrderPage = ({ onBack }) => {
  const { cartItems, getTotalItems, getTotalPrice } = useCart();

  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="order-page">
      <div className="order-header">
        <div className="order-header-left">
          <MdArrowBack size={36} onClick={onBack} className="back-button" />
          <h1>Order Details</h1>
        </div>
        <div className="order-header-right">
          <div className="order-info">
            <MdAccessTime size={24} />
            <span>{formatTime()}</span>
          </div>
          <div className="order-info">
            <MdTableRestaurant size={24} />
            <span>Table 1</span>
          </div>
          <div className="order-info">
            <MdPerson size={24} />
            <span>Waiter Name</span>
          </div>
        </div>
      </div>

      <div className="order-content">
        <div className="order-items">
          <h2>Ordered Items</h2>
          <div className="order-items-list">
            {cartItems.map((item) => (
              <div key={item.name} className="order-item">
                <div className="order-item-info">
                  <div className="order-item-icon">{item.icon}</div>
                  <div className="order-item-details">
                    <h3>{item.name}</h3>
                    <p>{item.desc}</p>
                  </div>
                </div>
                <div className="order-item-quantity">
                  <span>Qty: {item.quantity}</span>
                  <span className="order-item-price">ETB {item.price * item.quantity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="order-summary">
          <h2>Order Summary</h2>
          <div className="summary-item">
            <span>Total Items:</span>
            <span>{getTotalItems()}</span>
          </div>
          <div className="summary-item">
            <span>Subtotal:</span>
            <span>ETB {getTotalPrice()}</span>
          </div>
          <div className="summary-item">
            <span>Service Charge (10%):</span>
            <span>ETB {(getTotalPrice() * 0.1).toFixed(2)}</span>
          </div>
          <div className="summary-item total">
            <span>Total Amount:</span>
            <span>ETB {(getTotalPrice() * 1.1).toFixed(2)}</span>
          </div>
        </div>

        <div className="order-actions">
          <button className="print-btn">Print Order</button>
          <button className="complete-btn">Complete Order</button>
        </div>
      </div>
    </div>
  );
};

export default OrderPage; 