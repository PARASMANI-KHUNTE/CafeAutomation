import React, { useState, useEffect } from 'react';
import { useOrder } from '../context/OrderContext';
import { useSocket } from '../context/SocketContext';
import { orderAPI } from '../services/api';
import { Filter, RefreshCw, User, Phone, FileText, Clock } from 'lucide-react';
import AdminNavbar from '../components/AdminNavbar';

const AdminOrders = () => {
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
    // Get today's date at midnight for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Filter orders to only show today's orders
    const todaysOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });
    
    // Apply status filter if set
    if (filter === '') {
      setFilteredOrders(todaysOrders);
    } else {
      setFilteredOrders(todaysOrders.filter(order => order.status === filter));
    }
  }, [orders, filter]);
  
  // Function to load all orders
  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await orderAPI.getOrders();
      
      // Sort orders by creation date (newest first)
      const sortedOrders = data.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      setOrders(sortedOrders);
      setError('');
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to handle updating order status
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      // No need to manually update the orders array as the Socket.io event will handle it
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Failed to update order status');
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
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-indigo-100 text-indigo-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Live Orders</h1>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="">All Orders</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <button
              onClick={loadOrders}
              className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">No orders found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="p-4 border-b">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold">Order #{order._id.slice(-6)}</h3>
                      <p className="text-sm text-gray-500 flex items-center">
                        <Clock size={14} className="mr-1" />
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  
                  {/* Customer Details */}
                  {(order.customerName || order.customerPhone) && (
                    <div className="mb-3 bg-gray-50 p-2 rounded">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Customer:</h4>
                      {order.customerName && (
                        <p className="text-sm flex items-center">
                          <User size={14} className="mr-1 text-gray-500" />
                          {order.customerName}
                        </p>
                      )}
                      {order.customerPhone && (
                        <p className="text-sm flex items-center">
                          <Phone size={14} className="mr-1 text-gray-500" />
                          {order.customerPhone}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Table Number */}
                  <div className="mb-3">
                    <p className="text-sm text-blue-600">
                      Table: {getTableNumber(order)}
                    </p>
                  </div>
                  
                  {/* Kitchen Notes */}
                  {order.kitchenNotes && (
                    <div className="mb-3 bg-yellow-50 p-2 rounded">
                      <h4 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <FileText size={14} className="mr-1" />
                        Notes:
                      </h4>
                      <p className="text-sm">{order.kitchenNotes}</p>
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h4 className="font-medium text-gray-700 mb-2">Items:</h4>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <div>
                          <span className="font-medium">{item.menuItem.name}</span>
                          {item.notes && (
                            <p className="text-xs text-gray-500">{item.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-gray-600">x{item.quantity}</div>
                          <div className="text-gray-800">₹{(item.price * item.quantity).toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t mt-4 pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-semibold">Total:</span>
                      <span className="text-lg">₹{order.totalAmount.toFixed(2)}</span>
                    </div>
                    
                    {/* Status Update Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      {order.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(order._id, 'accepted')}
                            className="py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(order._id, 'cancelled')}
                            className="py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      
                      {order.status === 'accepted' && (
                        <button
                          onClick={() => handleUpdateStatus(order._id, 'preparing')}
                          className="py-2 col-span-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                          Start Preparing
                        </button>
                      )}
                      
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => handleUpdateStatus(order._id, 'ready')}
                          className="py-2 col-span-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          Mark as Ready
                        </button>
                      )}
                      
                      {order.status === 'ready' && (
                        <button
                          onClick={() => handleUpdateStatus(order._id, 'completed')}
                          className="py-2 col-span-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                          Complete Order
                        </button>
                      )}
                      
                      {/* Generate Receipt Button for any status */}
                      <button
                        onClick={() => {
                          // Create a receipt window
                          const receiptWindow = window.open('', '_blank', 'width=400,height=600');
                          
                          // Generate receipt HTML
                          const receiptHTML = `
                            <!DOCTYPE html>
                            <html>
                            <head>
                              <title>Receipt - Order #${order._id.slice(-6)}</title>
                              <style>
                                body {
                                  font-family: Arial, sans-serif;
                                  padding: 20px;
                                  max-width: 400px;
                                  margin: 0 auto;
                                }
                                .header {
                                  text-align: center;
                                  margin-bottom: 20px;
                                  border-bottom: 1px dashed #ccc;
                                  padding-bottom: 10px;
                                }
                                .order-info {
                                  margin-bottom: 20px;
                                }
                                .item {
                                  display: flex;
                                  justify-content: space-between;
                                  margin-bottom: 8px;
                                }
                                .total {
                                  margin-top: 20px;
                                  border-top: 1px dashed #ccc;
                                  padding-top: 10px;
                                  font-weight: bold;
                                  display: flex;
                                  justify-content: space-between;
                                }
                                .footer {
                                  margin-top: 30px;
                                  text-align: center;
                                  font-size: 14px;
                                  color: #666;
                                }
                                .print-button {
                                  display: block;
                                  margin: 20px auto;
                                  padding: 10px 20px;
                                  background-color: #4f46e5;
                                  color: white;
                                  border: none;
                                  border-radius: 4px;
                                  cursor: pointer;
                                }
                              </style>
                            </head>
                            <body>
                              <div class="header">
                                <h2>Cafe Automation</h2>
                                <p>Receipt</p>
                              </div>
                              
                              <div class="order-info">
                                <p><strong>Order #:</strong> ${order._id.slice(-6)}</p>
                                <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                                ${order.customerName ? `<p><strong>Customer:</strong> ${order.customerName}</p>` : ''}
                                <p><strong>Table:</strong> ${getTableNumber(order)}</p>
                              </div>
                              
                              <h3>Items</h3>
                              ${order.items.map(item => {
                                // Get item name safely
                                let itemName = 'Unknown Item';
                                if (item.menuItem) {
                                  if (typeof item.menuItem === 'object' && item.menuItem.name) {
                                    itemName = item.menuItem.name;
                                  } else if (item.name) {
                                    itemName = item.name;
                                  }
                                }
                                
                                return `
                                <div class="item">
                                  <div>
                                    <span>${itemName} x ${item.quantity}</span>
                                    ${item.notes ? `<br><small>${item.notes}</small>` : ''}
                                  </div>
                                  <span>₹${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                                `;
                              }).join('')}
                              
                              <div class="total">
                                <span>Total</span>
                                <span>₹${order.totalAmount.toFixed(2)}</span>
                              </div>
                              
                              <div class="footer">
                                <p>Thank you for your order!</p>
                                <p>Visit us again soon.</p>
                              </div>
                              
                              <button class="print-button" onclick="window.print(); return false;">Print Receipt</button>
                            </body>
                            </html>
                          `;
                          
                          // Write the receipt HTML to the new window
                          receiptWindow.document.write(receiptHTML);
                          receiptWindow.document.close();
                        }}
                        className={`py-2 ${order.status === 'completed' ? 'col-span-2' : 'col-span-1'} bg-amber-600 text-white rounded-lg hover:bg-amber-700`}
                      >
                        Generate Receipt
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
