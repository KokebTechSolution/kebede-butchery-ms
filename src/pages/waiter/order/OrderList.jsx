import React, { useState } from 'react';
import { MdCheck, MdRadioButtonUnchecked } from 'react-icons/md';
import './OrderList.css';

const mockOrders = [
  { id: '48-9038', checked: false },
  { id: '48-9039', checked: false },
  { id: '48-9040', checked: true }, // This one is selected in the image
  { id: '48-9041', checked: false },
  { id: '48-9042', checked: false },
];

const OrderList = ({ onSelectOrder }) => {
  const [orders, setOrders] = useState(mockOrders);
  const [activeTab, setActiveTab] = useState('Orders'); // Default to 'Orders' as per image

  const handleCheckboxChange = (orderId) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, checked: !order.checked } : order
      )
    );
  };

  return (
    <div className="order-list-container">
      <div className="order-list-main-header">
        <div className="order-list-tabs">
          <button 
            className={`order-list-tab ${activeTab === 'Orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('Orders')}
          >
            Orders
          </button>
        </div>
      </div>

      <div className="order-list-content">
        {orders.map((order) => (
          <div
            key={order.id}
            className={`order-list-item ${order.checked ? 'selected' : ''}`}
            onClick={() => onSelectOrder(order)} // Simulate selecting an order
          >
            <span
              className="order-checkbox"
              onClick={(e) => {
                e.stopPropagation(); // Prevent item click when clicking checkbox
                handleCheckboxChange(order.id);
              }}
            >
              {order.checked ? <MdCheck size={20} /> : <MdRadioButtonUnchecked size={20} />}
            </span>
            <span className="order-id">Order {order.id}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderList; 