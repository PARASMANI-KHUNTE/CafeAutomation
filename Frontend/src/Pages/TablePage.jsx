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
      
      // Also store in localStorage for API calls
      localStorage.setItem('sessionToken', sessionToken);

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-800 to-amber-700 text-white p-3 md:p-4 shadow-md sticky top-0 z-30">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-row justify-between items-center">
            <div className="flex items-center">
              <Coffee size={20} className="mr-1.5 text-amber-300" />
              <h1 className="text-base md:text-xl font-bold truncate">
                <span className="hidden xs:inline">Cozy Corner Café</span> 
                <span className="text-amber-200 whitespace-nowrap">| Table {tableNumber}</span>
              </h1>
            </div>
            <div className="flex items-center justify-end space-x-2 md:space-x-4">
              <button
                onClick={() => navigate('/orders')}
                className="flex items-center bg-amber-700/50 hover:bg-amber-600 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg transition-all text-xs sm:text-sm md:text-base shadow-sm hover:shadow focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50"
                aria-label="View my orders"
              >
                <ArrowLeft size={16} className="mr-1 sm:mr-2" />
                <span className="hidden xs:inline">My Orders</span>
              </button>
              <button
                onClick={() => setShowCartModal(true)}
                className="flex items-center bg-amber-600 hover:bg-amber-500 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg transition-all text-xs sm:text-sm md:text-base shadow-sm hover:shadow-md relative group"
                aria-label="View cart"
              >
                <ShoppingCart size={16} className="mr-1 sm:mr-2" />
                <span>Cart</span>
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-sm group-hover:animate-pulse">
                    {cart.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8">
        {/* Customer Details Modal */}
        {showCustomerDetailsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
              <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-amber-50 to-white">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 mr-2 sm:mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">Your Details</h2>
                </div>
                <button 
                  onClick={() => setShowCustomerDetailsModal(false)} 
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500"
                  aria-label="Close"
                >
                  <X size={18} className="sm:hidden" />
                  <X size={20} className="hidden sm:block" />
                </button>
              </div>
              
              <div className="p-3 sm:p-4 md:p-6">
                <p className="text-gray-600 mb-3 sm:mb-4 md:mb-5 text-xs sm:text-sm md:text-base">Please provide your details to complete your order. We'll use this information to contact you if needed.</p>
                
                <div className="mb-3 sm:mb-4 md:mb-5">
                  <label htmlFor="customerName" className="block text-gray-700 text-xs sm:text-sm md:text-base font-medium mb-1 sm:mb-2">Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      id="customerName"
                      value={customerDetails.name}
                      onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                      className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-xs sm:text-sm md:text-base shadow-sm"
                      placeholder="John Doe"
                      required
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4 sm:mb-5 md:mb-6">
                  <label htmlFor="customerPhone" className="block text-gray-700 text-xs sm:text-sm md:text-base font-medium mb-1 sm:mb-2">Phone Number</label>
                  <div className="relative">
                    <input
                      type="tel"
                      id="customerPhone"
                      value={customerDetails.phone}
                      onChange={(e) => setCustomerDetails({...customerDetails, phone: e.target.value})}
                      className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-xs sm:text-sm md:text-base shadow-sm"
                      placeholder="+91 98765 43210"
                      required
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    if (customerDetails.name && customerDetails.phone) {
                      setShowCustomerDetailsModal(false);
                      handlePlaceOrder();
                    }
                  }}
                  className="w-full bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white py-2.5 sm:py-3 rounded-lg transition-all text-sm sm:text-base font-medium shadow-sm hover:shadow-md flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50"
                >
                  <ShoppingCart size={16} className="mr-1.5 sm:mr-2" />
                  Continue to Order
                </button>
                
                <p className="mt-3 sm:mt-4 text-xs text-center text-gray-500">Your information is secure and will only be used for order processing.</p>
              </div>
            </div>
          </div>
        )}  
        
        {/* Order Success Modal */}
        {orderSuccess && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-xl w-full max-w-md text-center p-4 sm:p-6 md:p-8 overflow-hidden">
              <div className="mx-auto w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 bg-green-100 rounded-full flex items-center justify-center mb-3 sm:mb-4 md:mb-6 animate-scaleIn">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-2 sm:mb-3 md:mb-4 animate-fadeInUp">{orderSuccessMessage}</h2>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-4 sm:mb-5 md:mb-7 animate-fadeInUp delay-100">Your order has been received and is being prepared. You can track your order status in the orders page.</p>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:space-x-4 animate-fadeInUp delay-200">
                <button
                  onClick={() => {
                    setOrderSuccess(false);
                    navigate('/orders');
                  }}
                  className="w-full sm:flex-1 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white py-2 sm:py-2.5 md:py-3 rounded-lg transition-all text-sm md:text-base font-medium shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50 flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Track Order
                </button>
                <button
                  onClick={() => {
                    setOrderSuccess(false);
                  }}
                  className="w-full sm:flex-1 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 py-2 sm:py-2.5 md:py-3 rounded-lg transition-all text-sm md:text-base font-medium shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 flex items-center justify-center"
                >
                  <Coffee size={16} className="mr-1.5 sm:mr-2" />
                  Continue
                </button>
              </div>
              
              <div className="mt-4 sm:mt-5 md:mt-6 pt-3 sm:pt-4 md:pt-5 border-t border-gray-100 text-xs text-gray-500 animate-fadeInUp delay-300">
                <p>Order placed at: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
        )}  
        
        {/* Menu */}
        <div>
          {/* Categories */}
          <div className="sticky top-[52px] sm:top-[57px] md:top-[65px] z-20 bg-white shadow-sm border-b border-gray-200">
            <div className="container mx-auto max-w-7xl px-2 sm:px-3 md:px-4 py-2 md:py-3">
              <div className="flex overflow-x-auto pb-1 md:pb-2 scrollbar-hide gap-1.5 sm:gap-2 md:gap-3 no-scrollbar">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-2.5 sm:px-3 md:px-5 py-1 sm:py-1.5 md:py-2 rounded-full whitespace-nowrap text-xs sm:text-sm md:text-base font-medium transition-all ${
                      selectedCategory === category 
                        ? 'bg-amber-600 text-white shadow-md transform scale-105' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-amber-800'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Menu Items */}
          <div className="container mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-6 md:py-8">
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
              {filteredMenu.map((item) => (
                <div 
                  key={item._id} 
                  className="bg-white rounded-lg sm:rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 group"
                >
                  <div className="relative overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-36 xs:h-40 sm:h-44 md:h-48 lg:h-56 object-cover transform group-hover:scale-105 transition-transform duration-500" 
                      loading="lazy"
                    />
                    <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                      {item.category}
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 md:p-5">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-1 line-clamp-1">{item.name}</h3>
                    <p className="text-xs sm:text-sm md:text-base text-gray-600 line-clamp-2 mb-3 h-8 sm:h-10">{item.description}</p>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <span className="text-amber-700 font-bold text-base sm:text-lg md:text-xl">₹{item.price.toFixed(2)}</span>
                      <button
                        onClick={() => addToCart(item)}
                        className="bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-md sm:rounded-lg transition-all text-xs sm:text-sm md:text-base flex items-center gap-1 shadow-sm hover:shadow group-hover:scale-105"
                        aria-label={`Add ${item.name} to cart`}
                      >
                        <ShoppingCart size={14} className="sm:hidden" />
                        <ShoppingCart size={16} className="hidden sm:block" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredMenu.length === 0 && (
                <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                    <Coffee size={24} className="text-amber-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-1">No items found</h3>
                  <p className="text-gray-500">Try selecting a different category</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cart Modal */}
        {showCartModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden transform transition-all">
              <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-amber-50 to-white sticky top-0 z-10">
                <div className="flex items-center">
                  <ShoppingCart size={18} className="text-amber-600 mr-2 sm:mr-3" />
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">Your Cart</h2>
                </div>
                <button 
                  onClick={() => setShowCartModal(false)} 
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500"
                  aria-label="Close"
                >
                  <X size={18} className="sm:hidden" />
                  <X size={20} className="hidden sm:block" />
                </button>
              </div>
              
              <div className="overflow-auto p-3 sm:p-4 md:p-6" style={{ maxHeight: 'calc(95vh - 180px)' }}>
                {cart.length === 0 ? (
                  <div className="text-center py-8 sm:py-10 md:py-12">
                    <div className="mx-auto w-14 sm:w-16 md:w-20 h-14 sm:h-16 md:h-20 bg-amber-100 rounded-full flex items-center justify-center mb-3 sm:mb-4 md:mb-5">
                      <Coffee size={24} className="text-amber-600" />
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-medium text-gray-800 mb-2">Your cart is empty</h3>
                    <p className="text-gray-500 text-xs sm:text-sm md:text-base mb-4 sm:mb-6">Add some delicious items to get started</p>
                    <button 
                      onClick={() => setShowCartModal(false)}
                      className="inline-flex items-center px-3 sm:px-4 md:px-5 py-2 md:py-3 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white rounded-lg transition-all text-sm md:text-base shadow-sm hover:shadow-md"
                    >
                      <Coffee size={16} className="mr-1.5 sm:mr-2" />
                      Browse Menu
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4 md:space-y-5">
                    {cart.map((item) => (
                      <div key={item._id} className="flex items-center justify-between border-b border-gray-100 pb-3 sm:pb-4 md:pb-5 group hover:bg-amber-50/30 p-2 rounded-lg transition-colors">
                        <div className="flex items-center">
                          <div className="relative">
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 object-cover rounded-lg shadow-sm group-hover:shadow-md transition-all" 
                              loading="lazy"
                            />
                            <span className="absolute -top-2 -right-2 bg-amber-100 text-amber-800 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                              {item.quantity}
                            </span>
                          </div>
                          <div className="ml-3 sm:ml-4">
                            <h3 className="font-medium text-gray-800 text-sm sm:text-base md:text-lg group-hover:text-amber-800 transition-colors line-clamp-1">{item.name}</h3>
                            <p className="text-gray-500 text-xs sm:text-sm md:text-base">₹{item.price.toFixed(2)} per item</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 md:space-x-2">
                          <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden">
                            <button 
                              onClick={() => updateQuantity(item._id, item.quantity - 1)}
                              className="text-gray-600 hover:text-amber-700 hover:bg-gray-200 p-1 sm:p-1.5 md:p-2 transition-colors focus:outline-none"
                              disabled={item.quantity <= 1}
                              aria-label="Decrease quantity"
                            >
                              <Minus size={14} className="sm:hidden" />
                              <Minus size={16} className="hidden sm:block" />
                            </button>
                            <span className="w-6 sm:w-8 md:w-10 text-center text-xs sm:text-sm md:text-base font-medium">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item._id, item.quantity + 1)}
                              className="text-gray-600 hover:text-amber-700 hover:bg-gray-200 p-1 sm:p-1.5 md:p-2 transition-colors focus:outline-none"
                              aria-label="Increase quantity"
                            >
                              <Plus size={14} className="sm:hidden" />
                              <Plus size={16} className="hidden sm:block" />
                            </button>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item._id)}
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 sm:p-1.5 md:p-2 rounded-lg transition-colors focus:outline-none"
                            aria-label="Remove item"
                          >
                            <X size={16} className="sm:hidden" />
                            <X size={18} className="hidden sm:block" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {cart.length > 0 && (
                <div className="p-3 sm:p-4 md:p-6 border-t border-gray-200 bg-gradient-to-r from-amber-50 to-white sticky bottom-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-3 sm:mb-4 md:mb-5">
                    <div>
                      <span className="text-gray-500 text-xs sm:text-sm md:text-base">Subtotal ({cart.reduce((acc, item) => acc + item.quantity, 0)} items)</span>
                      <h4 className="font-bold text-lg sm:text-xl md:text-2xl text-gray-800">₹{calculateTotal().toFixed(2)}</h4>
                    </div>
                    <button
                      onClick={handlePlaceOrder}
                      disabled={loading}
                      className="flex items-center justify-center bg-amber-600 hover:bg-amber-500 active:bg-amber-700 disabled:bg-amber-300 text-white px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg transition-all text-sm md:text-base font-medium shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50 w-full sm:w-auto"
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        <>
                          <ShoppingCart size={16} className="mr-1.5 sm:mr-2" />
                          Place Order
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 text-center">By placing your order, you agree to our Terms of Service and Privacy Policy</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TablePage;
