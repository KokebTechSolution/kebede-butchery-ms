import { useState } from 'react';

const initialOrders = [
  {
    id: "#4567",
    table: "5",
    itemCount: 2,
    placedAt: "12:00 PM",
    items: [{ name: "Kurt", quantity: "1/2" }, { name: "Shekla Tibs", quantity: "1/2" }],
    status: 'pending'
  },
  {
    id: "#4568",
    table: "7",
    itemCount: 3,
    placedAt: "12:05 PM",
    items: [
      { name: "Kurt", quantity: "1/2" },
      { name: "Shekla Tibs", quantity: "1" },
      { name: "Dulet", quantity: "1" }
    ],
    status: 'pending'
  },
  {
    id: "#4569",
    table: "2",
    itemCount: 1,
    placedAt: "12:10 PM",
    items: [{ name: "Kitfo", quantity: "1" }],
    status: 'pending'
  }
];

export const useOrders = () => {
  const [orders, setOrders] = useState(initialOrders);

  const acceptOrder = (orderId) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId 
          ? { ...order, status: 'accepted'  }
          : order
      ).filter(order => order.status !== 'accepted')
    );
  };

  const rejectOrder = (orderId, reason) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId 
          ? { ...order, status: 'rejected' , rejectionReason: reason }
          : order
      )
    );
  };

  const getPendingOrders = () => orders.filter(order => order.status === 'pending');
  const getRejectedOrders = () => orders.filter(order => order.status === 'rejected');

  return {
    orders,
    acceptOrder,
    rejectOrder,
    getPendingOrders,
    getRejectedOrders
  };
};