import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { tokens } = useAuth();
  const [lastMessage, setLastMessage] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!tokens) {
      if (socket) {
        socket.close();
      }
      return;
    }

    const wsUrl = `ws://localhost:8000/ws/notifications/`;
    const newSocket = new WebSocket(wsUrl);

    newSocket.onopen = () => console.log('WebSocket connected');
    newSocket.onclose = () => console.log('WebSocket disconnected');
    newSocket.onerror = (error) => console.error('WebSocket error:', error);

    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Notification received:', data);
      setLastMessage(data);
    };

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [tokens]);

  const value = {
    lastMessage,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 