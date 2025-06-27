import React, { useEffect, useState } from 'react';
import { getMyOrders } from '../../../api/cashier'; // adjust path as needed
import './OrderList.css';

const OrderList = ({ onSelectOrder, selectedOrderId }) => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getMyOrders();
        setOrders(data);
      } catch (error) {
        setOrders([]);
      }
    };
    fetchOrders();
  }, []);

  return (
    <div className="order-list-container">
      <h2>Orders</h2>
      {orders.length === 0 ? (
        <p className="no-orders-message">No orders placed yet.</p>
      ) : (
        <div className="order-list">
          {orders.filter(order => order.order_number).map(order => (
            <div
              key={order.id}
              className={`order-list-item ${order.id === selectedOrderId ? 'active' : ''}`}
              onClick={() => onSelectOrder(order.id)}
            >
              <span className="order-list-item-id">{order.order_number}</span>
              <span className="order-list-item-table">Branch {order.branch}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderList; 