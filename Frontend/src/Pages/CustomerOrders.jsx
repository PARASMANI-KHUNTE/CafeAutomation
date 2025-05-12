import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useOrder } from '../context/OrderContext';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { menuAPI, orderAPI } from '../services/api';
import { PlusCircle, X, ShoppingCart, Bell, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';

const CustomerOrders = () => {
  const { orderHistory, loadOrderHistory, createOrder, setOrderHistory, loading, addItemsToOrder } = useOrder();
  const { subscribeToOrderUpdates } = useSocket();
  const navigate = useNavigate();
  
  // State for add more items functionality
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [isAddingItems, setIsAddingItems] = useState(false);
  const [cart, setCart] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [addItemsError, setAddItemsError] = useState('');
  const [addItemsSuccess, setAddItemsSuccess] = useState('');

  // Use a ref to track initial load
  const initialLoadRef = React.useRef(false);
  
  // Load order history when component mounts
  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      
      const loadOrders = async () => {
        try {
          await loadOrderHistory();
        } catch (loadError) {
          console.error('Error loading orders:', loadError);
        }
      };
      
      // Load orders immediately
      loadOrders();
    }
  }, [loadOrderHistory]);
  
  // Set up Socket.io listeners for real-time order updates
  useEffect(() => {
    if (orderHistory.length > 0) {
      // Set up Socket.io listeners for each order
      const unsubscribers = orderHistory.map(order => {
        return subscribeToOrderUpdates(order._id, (updatedOrder) => {
          // If we received a full order update
          if (updatedOrder._id) {
            // Update the specific order in the order history
            setOrderHistory(prev => 
              prev.map(o => o._id === updatedOrder._id ? updatedOrder : o)
            );
          } 
          // If we just received a status update
          else if (updatedOrder.status) {
            // Update just the status of the order
            setOrderHistory(prev => 
              prev.map(o => o._id === order._id ? {...o, status: updatedOrder.status} : o)
            );
          }
        });
      });
      
      // Clean up listeners on component unmount
      return () => {
        unsubscribers.forEach(unsub => {
          if (typeof unsub === 'function') unsub();
        });
      };
    }
  }, [orderHistory, subscribeToOrderUpdates, setOrderHistory]);
  
  // Load menu items when adding to an order
  useEffect(() => {
    if (isAddingItems) {
      const fetchMenuItems = async () => {
        setMenuLoading(true);
        try {
          const data = await menuAPI.getAllMenu();
          setMenuItems(data);
        } catch (menuError) {
          console.error('Error loading menu:', menuError);
          setAddItemsError('Failed to load menu items');
        } finally {
          setMenuLoading(false);
        }
      };
      fetchMenuItems();
    }
  }, [isAddingItems]);
  
  // Open the add items modal
  const handleAddMoreItems = (order) => {
    setSelectedOrder(order);
    setIsAddingItems(true);
    setCart([]);
    setAddItemsError('');
    setAddItemsSuccess('');
  };
  
  // Close the add items modal
  const handleCloseAddItems = () => {
    setIsAddingItems(false);
    setSelectedOrder(null);
    setCart([]);
  };
  
  // Add an item to the cart
  const addToCart = (menuItem) => {
    const existingItem = cart.find(item => item.menuItem._id === menuItem._id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.menuItem._id === menuItem._id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, {
        menuItem: menuItem,
        quantity: 1,
        price: menuItem.price,
        notes: ''
      }]);
    }
  };
  
  // Remove an item from the cart
  const removeFromCart = (menuItemId) => {
    setCart(cart.filter(item => item.menuItem._id !== menuItemId));
  };
  
  // Update item quantity in cart
  const updateQuantity = (menuItemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setCart(cart.map(item => 
      item.menuItem._id === menuItemId 
        ? { ...item, quantity: newQuantity } 
        : item
    ));
  };
  
  // Submit the additional items
  const handleSubmitAdditionalItems = async () => {
    if (!selectedOrder || cart.length === 0) return;
    
    try {
      // Format items for API
      const formattedItems = cart.map(item => ({
        menuItem: item.menuItem._id,
        quantity: item.quantity,
        price: item.menuItem.price,
        notes: item.notes
      }));
      
      // Prepare data object for the API call
      const addItemsData = {
        orderId: selectedOrder._id,
        items: formattedItems,
        customerName: selectedOrder.customerName || '',
        customerPhone: selectedOrder.customerPhone || ''
      };
      
      // Use the addItemsToOrder function from OrderContext instead of directly calling the API
      await addItemsToOrder(addItemsData);
      
      // Show success message
      setAddItemsSuccess('Items added to your order successfully!');
      
      // No need to reload order history as the context already updates it
      
      // Close modal after a delay
      setTimeout(() => {
        handleCloseAddItems();
      }, 2000);
      
    } catch (err) {
      console.error('Error adding items:', err);
      setAddItemsError('Failed to add items to your order. Please try again.');
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

  const getStatusMessage = (status) => {
    switch (status) {
      case 'pending':
        return 'Your order has been received and is waiting to be prepared.';
      case 'accepted':
        return 'Your order has been accepted by the kitchen.';
      case 'preparing':
        return 'Your order is being prepared by our kitchen staff.';
      case 'ready':
        return 'Your order is ready for pickup!';
      case 'completed':
        return 'Order completed. Thank you for your business!';
      default:
        return 'Unknown status';
    }
  };

  // Handler for "Order Again" button - creates a new order with the same items
  const handleOrderAgain = (order) => {
    // Extract tableId from the order
    let tableId = order.tableId;
    let tableNumber;
    
    // If tableId is an object (populated), get the _id and tableNumber
    if (typeof tableId === 'object' && tableId !== null) {
      tableNumber = tableId.tableNumber;
      tableId = tableId._id;
    } else {
      // If we only have the ID, try to extract table number from the customer name or order info
      tableNumber = order.tableNumber || '';
    }
    
    // If no tableNumber is found, prompt the user to enter one
    if (!tableNumber) {
      tableNumber = prompt('Please enter your table number:');
      if (!tableNumber) {
        toast.error('Table number is required to place a new order.');
        return;
      }
    }
    
    // Redirect to the table page for creating a new order
    toast.info('Redirecting to menu page to create a new order...');
    navigate(`/table/${tableNumber}`);
  };

  // Handler for customer assistance request
  const handleRequestAssistance = async (order) => {
    // Get table number
    let tableNumber = getTableNumber(order);
    
    // Get customer name
    const customerName = order.customerName || 'Customer';
    
    try {
      // Play alert sound
      const alertSound = new Audio('/alert.mp3');
      alertSound.play().catch(e => console.error('Error playing sound:', e));
      
      // Send assistance request to server
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/orders/assistance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order._id,
          customerName,
          tableNumber,
          message: 'Customer needs assistance'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Assistance request sent successfully!');
      } else {
        toast.error('Failed to send assistance request. Please try again.');
      }
    } catch (error) {
      console.error('Error requesting assistance:', error);
      toast.error('Failed to send assistance request. Please try again.');
    }
  };
  
  // Handler for "Generate Receipt" button
  const handleGenerateReceipt = (order) => {
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
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">My Orders</h1>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            Back to Menu
          </button>
        </div>

        {/* Error alert is handled by OrderContext */}

        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        ) : orderHistory.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">You haven't placed any orders yet.</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orderHistory.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Order #{order._id.slice(-6)}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                    {order.customerName && (
                      <p className="text-sm text-amber-600 mt-1">
                        Customer: {order.customerName} {order.customerPhone && `(${order.customerPhone})`}
                      </p>
                    )}
                    {order.tableId && (
                      <p className="text-sm text-blue-600 mt-1">
                        Table: {order.tableId.tableNumber || 'Unknown'}
                      </p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {order.items.map((item) => (
                    <div key={item._id} className="flex justify-between items-center">
                      <span>{item.menuItem.name}</span>
                      <span className="text-gray-600">x{item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Order Items */}
                <div className="mt-4 mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Order Items:</h4>
                  <div className="space-y-2 bg-gray-50 p-3 rounded">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div className="flex-1">
                          <span className="font-medium">{item.menuItem.name}</span>
                          {item.notes && (
                            <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-600">x{item.quantity}</span>
                          <span className="text-gray-800">₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold">Total:</span>
                    <span className="text-lg">₹{order.totalAmount.toFixed(2)}</span>
                  </div>
                  
                  {/* Status message */}
                  <div className="bg-gray-50 p-3 rounded-lg mb-4">
                    <p className="text-gray-700">{getStatusMessage(order.status)}</p>
                  </div>
                  
                  {/* Options for orders that are not completed */}
                  {order.status !== 'completed' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddMoreItems(order)}
                        className="flex-1 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center justify-center gap-2"
                      >
                        <PlusCircle size={16} />
                        <span>Add More Items</span>
                      </button>
                      <button
                        onClick={() => handleRequestAssistance(order)}
                        className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                      >
                        <Bell size={16} />
                        <span>Request Assistance</span>
                      </button>
                    </div>
                  )}
                  
                  {/* Options for completed orders */}
                  {order.status === 'completed' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOrderAgain(order)}
                        className="flex-1 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center justify-center gap-2"
                      >
                        <ShoppingCart size={16} />
                        <span>Order Again</span>
                      </button>
                      <button
                        onClick={() => handleGenerateReceipt(order)}
                        className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        <span>Receipt</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Add More Items Modal */}
      <AnimatePresence>
        {isAddingItems && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="p-4 border-b flex justify-between items-center bg-amber-50">
                <h3 className="text-lg font-semibold">Add More Items to Order #{selectedOrder._id.slice(-6)}</h3>
                <button 
                  onClick={handleCloseAddItems}
                  className="p-1 rounded-full hover:bg-amber-100"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Modal Content */}
              <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                {/* Menu Items */}
                <div className="md:w-2/3 p-4 overflow-y-auto">
                  {addItemsError && (
                    <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4">
                      {addItemsError}
                    </div>
                  )}
                  
                  {addItemsSuccess && (
                    <div className="bg-green-100 text-green-800 p-3 rounded-lg mb-4">
                      {addItemsSuccess}
                    </div>
                  )}
                  
                  {menuLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {menuItems.map(item => (
                        <div 
                          key={item._id} 
                          className="border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => addToCart(item)}
                        >
                          <div className="flex items-center">
                            {item.image && (
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                className="w-16 h-16 object-cover rounded-md mr-3"
                              />
                            )}
                            <div>
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="text-sm text-gray-500">{item.description}</p>
                              <p className="text-amber-600 font-medium mt-1">${item.price.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Cart */}
                <div className="md:w-1/3 bg-gray-50 p-4 overflow-y-auto border-t md:border-t-0 md:border-l">
                  <div className="flex items-center mb-4">
                    <ShoppingCart size={20} className="text-amber-600 mr-2" />
                    <h4 className="font-medium">Your Cart</h4>
                  </div>
                  
                  {cart.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Your cart is empty. Click on menu items to add them.</p>
                  ) : (
                    <>
                      <div className="space-y-3 mb-4">
                        {cart.map(item => (
                          <div key={item.menuItem._id} className="flex justify-between items-center bg-white p-2 rounded-lg shadow-sm">
                            <div className="flex-1">
                              <p className="font-medium">{item.menuItem.name}</p>
                              <p className="text-sm text-gray-500">${item.menuItem.price.toFixed(2)}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => updateQuantity(item.menuItem._id, item.quantity - 1)}
                                className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full"
                              >
                                -
                              </button>
                              <span>{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.menuItem._id, item.quantity + 1)}
                                className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full"
                              >
                                +
                              </button>
                              <button 
                                onClick={() => removeFromCart(item.menuItem._id)}
                                className="ml-2 text-red-500"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="border-t pt-3 mt-auto">
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">Total:</span>
                          <span className="font-medium">
                            ${cart.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0).toFixed(2)}
                          </span>
                        </div>
                        <button
                          onClick={handleSubmitAdditionalItems}
                          disabled={cart.length === 0 || addItemsSuccess}
                          className={`w-full py-2 rounded-lg ${cart.length === 0 || addItemsSuccess ? 'bg-gray-300 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700'} text-white`}
                        >
                          Add to Order
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerOrders; 