import React, { useState, useEffect } from 'react';
import { Coffee, ShoppingCart, X, Plus, Minus, User, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';
import { authAPI, menuAPI, orderAPI } from '../services/api';
import Cookies from 'js-cookie';
import config from '../config';

const LandingPage = () => {
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState('menu');
  const [kitchenCredentials, setKitchenCredentials] = useState({ email: '', password: '' });
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderSuccessMessage, setOrderSuccessMessage] = useState('Your order has been placed successfully!');
  const [selectedTable, setSelectedTable] = useState(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [tables, setTables] = useState([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    phone: ''
  });
  const [showCustomerDetailsModal, setShowCustomerDetailsModal] = useState(false);

  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { createOrder, currentOrder } = useOrder();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const data = await menuAPI.getAllMenu();
        setMenuItems(data);
        const uniqueCategories = Array.from(new Set(data.map(item => item.category))).filter(Boolean);
        setCategories(['All', ...uniqueCategories]);
      } catch (err) {
        console.error('Error fetching menu:', err);
      }
    };
    fetchMenu();
  }, []);

  useEffect(() => {
    // Load available tables
    const loadTables = async () => {
      try {
        const response = await fetch(`${config.API_URL}/tables`);
        const data = await response.json();
        setTables(data);
      } catch (err) {
        console.error('Error loading tables:', err);
      }
    };
    loadTables();
  }, []);

  const handleKitchenLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await authAPI.login(kitchenCredentials.email, kitchenCredentials.password);
      const success = await login({ token: data.token, role: data.role, email: kitchenCredentials.email });
      if (success && data.role === 'staff') navigate('/kitchen');
      else setError('Invalid kitchen credentials');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

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
    if (!selectedTable) {
      setShowTableModal(true);
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
      
      // Check if customer has an existing active order
      try {
        // Get customer's orders using the session token
        const existingOrders = await orderAPI.getCustomerOrders();
        
        // Find the most recent pending or accepted order
        const activeOrder = existingOrders.find(order => 
          (order.status === 'pending' || order.status === 'accepted') && 
          order.tableId && 
          (typeof order.tableId === 'object' ? 
            order.tableId._id === selectedTable : 
            order.tableId === selectedTable)
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
          
          // Show success message indicating items were added to existing order
          setOrderSuccess(true);
          setOrderSuccessMessage('Items added to your existing order!');
        } else {
          // No active order - create a new one
          const orderData = {
            items: orderItems,
            totalAmount: cart.reduce((total, item) => total + (item.price * item.quantity), 0),
            status: 'pending',
            tableId: selectedTable,
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
          totalAmount: cart.reduce((total, item) => total + (item.price * item.quantity), 0),
          status: 'pending',
          tableId: selectedTable,
          customerName: customerDetails.name,
          customerPhone: customerDetails.phone,
          sessionToken
        };
        
        await createOrder(orderData);
        setOrderSuccess(true);
        setOrderSuccessMessage('Your order has been placed successfully!');
      }
      
      // Reset cart and form data
      setCart([]);
      setSelectedTable(null);
      setCustomerDetails({ name: '', phone: '' });
      setShowTableModal(false);
    } catch (err) {
      setError('Failed to place order. Please try again.');
      console.error('Error placing order:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMenu = selectedCategory === 'All' ? menuItems : menuItems.filter((i) => i.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-amber-800 text-white p-4 sticky top-0 z-10 shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Coffee size={32} className="mr-2" />
            <h1 className="text-2xl font-bold">Cozy Corner Café</h1>
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
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/orders')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg"
              >
                My Orders
              </button>
              {!user && (
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 rounded-lg"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8">
        {/* Order Success */}
        {orderSuccess && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-4">Order Placed Successfully!</h2>
              <p className="mb-6">{orderSuccessMessage} You can track your order status in the "My Orders" section.</p>
              <button
                onClick={() => setOrderSuccess(false)}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Menu */}
        {activeSection === 'menu' && (
          <div>
            <h2 className="text-2xl font-bold text-amber-800 mb-4">Our Menu</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full border transition-colors ${selectedCategory === cat ? 'bg-amber-600 text-white' : 'bg-white text-amber-800 border-amber-600 hover:bg-amber-100'}`}
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
        )}

        {/* Customer Details Modal */}
        {showCustomerDetailsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-amber-800">Customer Details</h2>
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
                setShowTableModal(true);
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
                    Continue to Table Selection
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Table Selection Modal */}
        {showTableModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-amber-800">Select a Table</h2>
                <button
                  onClick={() => setShowTableModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {tables.filter(table => table.status === 'available').map(table => (
                  <button
                    key={table._id}
                    onClick={() => {
                      setSelectedTable(table._id);
                      handlePlaceOrder();
                    }}
                    className={`p-4 rounded-lg border ${
                      selectedTable === table._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    Table {table.tableNumber}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowTableModal(false)}
                className="w-full py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
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
                          <p className="text-amber-700">₹{item.price}</p>
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
                      <span>₹{calculateTotal().toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => {
                        setShowCartModal(false);
                        setShowCustomerDetailsModal(true);
                      }}
                      className="w-full bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700"
                    >
                      Proceed to Order
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

export default LandingPage;