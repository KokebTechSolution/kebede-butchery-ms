// src/context/NotificationContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { tokens } = useAuth();
  const [lastMessage, setLastMessage] = useState(null);
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!tokens) {
      if (socket) socket.close();
      return;
    }

    // Use network address for WebSocket connection
    const wsUrl = `ws://192.168.1.8:8000/ws/notifications/`;
    const newSocket = new WebSocket(wsUrl);

    newSocket.onopen = () => console.log('✅ WebSocket connected');
    newSocket.onclose = () => console.log('❌ WebSocket disconnected');
    newSocket.onerror = (error) => console.error('WebSocket error:', error);

    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📬 Notification received:', data);
        setLastMessage(data);
        
        // Add to notifications array
        const newNotification = {
          id: Date.now(),
          message: data.message,
          timestamp: new Date(),
          type: 'info'
        };
        setNotifications(prev => [...prev, newNotification]);
        
        // Auto-remove notification after 5 seconds
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
        }, 5000);
      } catch (err) {
        console.error('Invalid message received:', err);
      }
    };

    setSocket(newSocket);
    return () => newSocket.close();

  }, [tokens]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ 
      lastMessage, 
      notifications, 
      clearNotifications, 
      removeNotification 
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
