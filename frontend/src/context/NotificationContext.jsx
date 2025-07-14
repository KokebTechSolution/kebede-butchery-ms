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

  useEffect(() => {
    if (!tokens) {
      if (socket) socket.close();
      return;
    }

    const wsUrl = `ws://localhost:8000/ws/notifications/`;
    const newSocket = new WebSocket(wsUrl);

    newSocket.onopen = () => console.log('✅ WebSocket connected');
    newSocket.onclose = () => console.log('❌ WebSocket disconnected');
    newSocket.onerror = (error) => console.error('WebSocket error:', error);

    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📬 Notification received:', data);
        setLastMessage(data);
      } catch (err) {
        console.error('Invalid message received:', err);
      }
    };

    setSocket(newSocket);
    return () => newSocket.close();

  }, [tokens]);

  return (
    <NotificationContext.Provider value={{ lastMessage }}>
      {children}
    </NotificationContext.Provider>
  );
};
