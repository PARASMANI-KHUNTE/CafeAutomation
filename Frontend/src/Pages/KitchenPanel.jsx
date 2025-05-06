import React, { useState, useEffect } from 'react';
import { useOrder } from '../context/OrderContext';
import { useSocket } from '../context/SocketContext';
import { orderAPI } from '../services/api';
import { Filter, Clock, RefreshCw, User, Phone, FileText } from 'lucide-react';

const KitchenPanel = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  const { updateOrderStatus } = useOrder();
  const { subscribeToKitchenUpdates } = useSocket();

  // Load orders initially and set up Socket.io for real-time updates
  useEffect(() => {
    // Initial load of orders
    loadOrders();
    
    // Subscribe to kitchen updates via Socket.io
    const unsubscribe = subscribeToKitchenUpdates((eventType, data) => {
      if (eventType === 'newOrder') {
        // Add the new order to the list
        setOrders(prevOrders => [data, ...prevOrders]);
      } 
      else if (eventType === 'orderUpdated') {
        // Update the specific order in the list
        setOrders(prevOrders => 
          prevOrders.map(order => order._id === data._id ? data : order)
        );
      }
      else if (eventType === 'statusChanged') {
        // Update just the status of the order
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === data.orderId ? {...order, status: data.status} : order
          )
        );
      }
    });
    
    // Clean up on unmount
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [subscribeToKitchenUpdates]);
  
  // Filter orders whenever the orders array or filter value changes
  useEffect(() => {
    if (filter === '') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status === filter));
    }
  }, [orders, filter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await orderAPI.getOrders();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setLoading(true);
      await updateOrderStatus(orderId, newStatus);
      await loadOrders(); // Reload orders to get fresh data
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to safely get table number from an order
  const getTableNumber = (order) => {
    if (!order.tableId) return 'N/A';
    
    if (typeof order.tableId === 'object') {
      // If tableId is a populated object with tableNumber property
      if (order.tableId.tableNumber) {
        return order.tableId.tableNumber;
      }
      // If it has an _id but no tableNumber
      if (order.tableId._id) {
        return `Table ID: ${order.tableId._id.slice(-4)}`;
      }
    }
    // If tableId is a string (just the ID)
    else if (typeof order.tableId === 'string') {
      return `Table ID: ${order.tableId.slice(-4)}`;
    }
    
    return 'N/A';
  };

  // Function to get status color based on status
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Kitchen Orders</h1>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={18} />
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="border rounded p-2"
              >
                <option value="">All Orders</option>
                <option value="pending">Pending</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            <button 
              onClick={loadOrders} 
              className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-2 rounded hover:bg-blue-200"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-lg shadow-md p-4"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Order #{order._id.slice(-6)}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                  {order.customerName && (
                    <div className="flex items-center gap-1 text-sm text-amber-600 mt-1">
                      <User size={14} />
                      <span>{order.customerName}</span>
                    </div>
                  )}
                  {order.customerPhone && (
                    <div className="flex items-center gap-1 text-sm text-amber-600 mt-1">
                      <Phone size={14} />
                      <span>{order.customerPhone}</span>
                    </div>
                  )}
                  {/* Table Number */}
                  <div className="flex items-center gap-1 text-sm text-blue-600 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="4" width="16" height="16" rx="2"></rect>
                      <line x1="4" y1="10" x2="20" y2="10"></line>
                    </svg>
                    <span>Table: {getTableNumber(order)}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                {order.items.map((item) => (
                  <div key={item._id} className="flex flex-col mb-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{item.menuItem.name}</span>
                      <span className="text-gray-600">x{item.quantity}</span>
                    </div>
                    {item.notes && (
                      <div className="flex items-start gap-1 text-sm text-gray-600 mt-1 ml-2">
                        <FileText size={14} className="mt-0.5" />
                        <span>{item.notes}</span>
                      </div>
                    )}
                  </div>
                ))}
                
                {order.kitchenNotes && (
                  <div className="mt-3 p-2 bg-amber-50 rounded border border-amber-200">
                    <div className="flex items-center gap-1 text-sm text-amber-800 font-medium mb-1">
                      <FileText size={14} />
                      <span>Kitchen Notes:</span>
                    </div>
                    <p className="text-sm text-amber-700">{order.kitchenNotes}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold">Total:</span>
                  <span className="text-lg">₹{order.totalAmount.toFixed(2)}</span>
                </div>

                <div className="flex gap-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleStatusUpdate(order._id, 'preparing')}
                      className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                    >
                      Start Preparing
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => handleStatusUpdate(order._id, 'ready')}
                      className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700"
                    >
                      Mark Ready
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button
                      onClick={() => handleStatusUpdate(order._id, 'completed')}
                      className="flex-1 bg-gray-600 text-white py-2 rounded hover:bg-gray-700"
                    >
                      Complete Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KitchenPanel; 