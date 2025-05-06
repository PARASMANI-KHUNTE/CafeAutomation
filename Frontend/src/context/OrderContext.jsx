import React, { createContext, useContext, useState, useEffect } from 'react';
import { orderAPI } from '../services/api';
import { useAuth } from './AuthContext';

const OrderContext = createContext(null);

export const OrderProvider = ({ children }) => {
    const [currentOrder, setCurrentOrder] = useState(null);
    const [orderHistory, setOrderHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    // Use a ref to track if we've already loaded orders to prevent infinite loops
    const initialLoadRef = React.useRef(false);
    
    useEffect(() => {
        // Only load order history once when the component mounts
        if (!initialLoadRef.current) {
            initialLoadRef.current = true;
            loadOrderHistory();
        }
    }, []);

    const loadOrderHistory = async () => {
        try {
            setLoading(true);
            const orders = await orderAPI.getCustomerOrders();
            setOrderHistory(orders);
            setError(null);
        } catch (err) {
            setError('Failed to load order history');
            console.error('Error loading order history:', err);
        } finally {
            setLoading(false);
        }
    };

    const createOrder = async (orderData) => {
        try {
            setLoading(true);
            // Add session token to order data
            const orderWithSession = {
                ...orderData,
                sessionToken: user?.sessionToken
            };
            const newOrder = await orderAPI.createOrder(orderWithSession);
            setCurrentOrder(newOrder);
            if (user?.token) {
                await loadOrderHistory();
            }
            setError(null);
            return newOrder;
        } catch (err) {
            setError('Failed to create order');
            console.error('Error creating order:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, status) => {
        try {
            setLoading(true);
            const updatedOrder = await orderAPI.updateOrderStatus(orderId, status);
            setOrderHistory(prev => 
                prev.map(order => 
                    order._id === orderId ? updatedOrder : order
                )
            );
            if (currentOrder?._id === orderId) {
                setCurrentOrder(updatedOrder);
            }
            setError(null);
            return updatedOrder;
        } catch (err) {
            setError('Failed to update order status');
            console.error('Error updating order status:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const clearCurrentOrder = () => {
        setCurrentOrder(null);
    };

    // Add items to an existing order
    const addItemsToOrder = async (addItemsData) => {
        try {
            setLoading(true);
            // Call the API to add items to the order
            const updatedOrder = await orderAPI.addMoreItems(addItemsData);
            
            // Update the order history with the updated order
            setOrderHistory(prev => 
                prev.map(order => 
                    order._id === addItemsData.orderId ? updatedOrder : order
                )
            );
            
            setError(null);
            return updatedOrder;
        } catch (err) {
            setError('Failed to add items to order');
            console.error('Error adding items to order:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const value = {
        currentOrder,
        orderHistory,
        setOrderHistory, // Expose setOrderHistory for real-time updates
        loading,
        error,
        createOrder,
        updateOrderStatus,
        clearCurrentOrder,
        loadOrderHistory,
        addItemsToOrder // Add the new function to the context
    };

    return (
        <OrderContext.Provider value={value}>
            {children}
        </OrderContext.Provider>
    );
};

export const useOrder = () => {
    const context = useContext(OrderContext);
    if (!context) {
        throw new Error('useOrder must be used within an OrderProvider');
    }
    return context;
}; 