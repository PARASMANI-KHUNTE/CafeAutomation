import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

// Create context
const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();
  
  // Initialize socket connection
  useEffect(() => {
    // Create socket connection
    const socketInstance = io(import.meta.env.VITE_API_URL || 'http://localhost:8000', {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    // Socket event listeners
    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setConnected(true);
      
      // Join kitchen room if user is staff or admin
      if (user && (user.role === 'admin' || user.role === 'staff')) {
        socketInstance.emit('joinKitchen');
      }
    });
    
    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });
    
    socketInstance.on('error', (error) => {
      console.error('Socket error:', error);
    });
    
    // Set socket in state
    setSocket(socketInstance);
    
    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [user]);
  
  // Join a specific order room
  const joinOrderRoom = (orderId) => {
    if (socket && orderId) {
      socket.emit('joinOrderRoom', orderId);
    }
  };
  
  // Subscribe to order updates
  const subscribeToOrderUpdates = (orderId, callback) => {
    if (!socket) return;
    
    // Join the order's room
    joinOrderRoom(orderId);
    
    // Listen for order updates
    socket.on('orderUpdated', (updatedOrder) => {
      if (updatedOrder._id === orderId) {
        callback(updatedOrder);
      }
    });
    
    // Listen for status changes
    socket.on('orderStatusChanged', (data) => {
      if (data.orderId === orderId) {
        callback({ status: data.status });
      }
    });
    
    // Return unsubscribe function
    return () => {
      socket.off('orderUpdated');
      socket.off('orderStatusChanged');
    };
  };
  
  // Subscribe to all kitchen updates
  const subscribeToKitchenUpdates = (callback) => {
    if (!socket) return;
    
    // Join the kitchen room
    socket.emit('joinKitchen');
    
    // Listen for new orders
    socket.on('newOrder', (order) => {
      callback('newOrder', order);
    });
    
    // Listen for order updates
    socket.on('orderUpdated', (order) => {
      callback('orderUpdated', order);
    });
    
    // Listen for status changes
    socket.on('orderStatusChanged', (data) => {
      callback('statusChanged', data);
    });
    
    // Return unsubscribe function
    return () => {
      socket.off('newOrder');
      socket.off('orderUpdated');
      socket.off('orderStatusChanged');
    };
  };
  
  return (
    <SocketContext.Provider value={{ 
      socket, 
      connected, 
      joinOrderRoom,
      subscribeToOrderUpdates,
      subscribeToKitchenUpdates
    }}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use the socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
