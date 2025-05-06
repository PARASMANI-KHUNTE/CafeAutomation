import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, X, Coffee, ArrowLeft, Plus, Minus } from 'lucide-react';
import { menuAPI, orderAPI } from '../services/api';
import { useOrder } from '../context/OrderContext';
import config from '../config';
import Cookies from 'js-cookie';

const TablePage = () => {
  const { tableNumber } = useParams();
  const navigate = useNavigate();
  const { createOrder } = useOrder();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [table, setTable] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderSuccessMessage, setOrderSuccessMessage] = useState('Your order has been placed successfully!');
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    phone: ''
  });
  const [showCustomerDetailsModal, setShowCustomerDetailsModal] = useState(false);

  // Fetch table data
  useEffect(() => {
    const fetchTable = async () => {
      try {
        const response = await fetch(`${config.API_URL}/tables/number/${tableNumber}`);
        if (!response.ok) {
          throw new Error('Table not found');
        }
        const data = await response.json();
        setTable(data);
      } catch (err) {
        console.error('Error fetching table:', err);
        setError('Invalid table or QR code');
      } finally {
        setLoading(false);
      }
    };

    fetchTable();
  }, [tableNumber]);

  // Fetch menu items
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const data = await menuAPI.getAllMenu();
        setMenuItems(data.filter(item => item.isAvailable));
        const uniqueCategories = Array.from(new Set(data.map(item => item.category))).filter(Boolean);
        setCategories(['All', ...uniqueCategories]);
      } catch (err) {
        console.error('Error fetching menu:', err);
        setError('Failed to load menu items');
      }
    };
    fetchMenu();
  }, []);

  const addToCart = (item) => {
    setCart((prevCart) => {
      const existing = prevCart.find((c) => c._id === item._id);
      if (existing) {
        return prevCart.map((c) => (c._id === item._id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((i) => i._id !== id));

  const updateQuantity = (id, qty) => {
    if (qty < 1) return;
    setCart((prev) => prev.map((i) => (i._id === id ? { ...i, quantity: qty } : i)));
  };

  const calculateTotal = () => cart.reduce((t, i) => t + i.price * i.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!customerDetails.name || !customerDetails.phone) {
      setShowCustomerDetailsModal(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Generate a session token if not exists
      let sessionToken = Cookies.get('sessionToken');
      if (!sessionToken) {
        sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
        Cookies.set('sessionToken', sessionToken, { expires: 7 }); // Expires in 7 days
      }

      // Prepare order items data
      const orderItems = cart.map(item => ({
        menuItem: item._id,
        quantity: item.quantity,
        price: item.price
      }));
      
      // Check if customer has an existing active order for this table
      try {
        // Get customer's orders using the session token
        const existingOrders = await orderAPI.getCustomerOrders();
        
        // Find the most recent pending or accepted order for this table
        const activeOrder = existingOrders.find(order => 
          (order.status === 'pending' || order.status === 'accepted') && 
          order.tableId && 
          (typeof order.tableId === 'object' ? 
            order.tableId._id === table._id : 
            order.tableId === table._id)
        );
        
        if (activeOrder) {
          // Customer has an active order - add items to it
          console.log('Adding to existing order:', activeOrder._id);
          
          // Prepare data for adding more items
          const addItemsData = {
            orderId: activeOrder._id,
            items: orderItems,
            customerName: customerDetails.name,
            customerPhone: customerDetails.phone
          };
          
          // Add items to existing order
          await orderAPI.addMoreItems(addItemsData);
          
          // Show success message
          setOrderSuccess(true);
          setOrderSuccessMessage('Items added to your existing order!');
        } else {
          // No active order - create a new one
          const orderData = {
            items: orderItems,
            totalAmount: calculateTotal(),
            tableId: table._id,
            customerName: customerDetails.name,
            customerPhone: customerDetails.phone,
            sessionToken
          };
          
          await createOrder(orderData);
          setOrderSuccess(true);
          setOrderSuccessMessage('Your order has been placed successfully!');
        }
      } catch (fetchError) {
        console.error('Error checking existing orders:', fetchError);
        
        // Fallback to creating a new order if we can't check existing ones
        const orderData = {
          items: orderItems,
          totalAmount: calculateTotal(),
          tableId: table._id,
          customerName: customerDetails.name,
          customerPhone: customerDetails.phone,
          sessionToken
        };
        
        await createOrder(orderData);
        setOrderSuccess(true);
        setOrderSuccessMessage('Your order has been placed successfully!');
      }
      
      // Reset cart and close modal
      setCart([]);
      setShowCartModal(false);
    } catch (err) {
      setError('Failed to place order. Please try again.');
      console.error('Error placing order:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMenu = selectedCategory === 'All' 
    ? menuItems 
    : menuItems.filter((i) => i.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 text-red-700 p-6 rounded-lg max-w-md text-center">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 bg-amber-600 text-white px-4 py-2 rounded-lg"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (!table) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 text-red-700 p-6 rounded-lg max-w-md text-center">
          <h2 className="text-xl font-bold mb-2">Table Not Found</h2>
          <p>The table you're looking for doesn't exist.</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 bg-amber-600 text-white px-4 py-2 rounded-lg"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-amber-800 text-white p-4 sticky top-0 z-10 shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Table {table.tableNumber}</h1>
            <p className="text-sm">Cozy Corner Café</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowCartModal(true)}
              className="relative p-2 hover:bg-amber-700 rounded-lg"
            >
              <ShoppingCart size={24} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8">
        {/* Order Success */}
        {orderSuccess && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Order Placed Successfully!</h3>
              <p className="text-gray-600 mb-4">{orderSuccessMessage}</p>
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => navigate('/orders')}
                  className="w-full py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                >
                  View My Orders
                </button>
                <button
                  onClick={() => {
                    setOrderSuccess(false);
                  }}
                  className="w-full py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Order More Items
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Menu */}
        <div>
          <h2 className="text-2xl font-bold text-amber-800 mb-4">Our Menu</h2>
          <div className="flex overflow-x-auto pb-2 mb-4 gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full border whitespace-nowrap transition-colors ${
                  selectedCategory === cat 
                    ? 'bg-amber-600 text-white' 
                    : 'bg-white text-amber-800 border-amber-600 hover:bg-amber-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredMenu.map((item) => (
              <div key={item._id} className="bg-white rounded-lg shadow-md p-4 flex flex-col">
                {item.image && (
                  <img src={item.image} alt={item.name} className="w-full h-48 object-cover rounded-lg mb-4" />
                )}
                <h3 className="text-xl font-semibold text-amber-800">{item.name}</h3>
                <p className="text-gray-600 mb-2 flex-1">{item.description}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-lg font-bold text-amber-700">₹{item.price}</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">{item.category}</span>
                </div>
                <button
                  onClick={() => addToCart(item)}
                  className="mt-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Details Modal */}
        {showCustomerDetailsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-amber-800">Your Details</h2>
                <button
                  onClick={() => setShowCustomerDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                setShowCustomerDetailsModal(false);
                handlePlaceOrder();
              }}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={customerDetails.name}
                      onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={customerDetails.phone}
                      onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700"
                  >
                    Continue to Checkout
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Cart Modal */}
        {showCartModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-amber-800">Your Cart</h2>
                <button
                  onClick={() => setShowCartModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Your cart is empty</p>
              ) : (
                <>
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item._id} className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-amber-700">${item.price}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity - 1)}
                            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between text-xl font-bold mb-4">
                      <span>Total:</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                    <button
                      onClick={handlePlaceOrder}
                      className="w-full bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700"
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TablePage;
