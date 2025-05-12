import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Printer, FileText, Calendar, Clock, 
  ChevronDown, ChevronUp, Download, RefreshCw, X 
} from 'lucide-react';
import { orderAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  
  // Fetch orders on component mount
  useEffect(() => {
    fetchOrders();
  }, []);

  // Apply filters whenever dependencies change
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, searchTerm, dateRange, statusFilter, sortConfig]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await orderAPI.getOrders();
      setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
      toast.error('Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...orders];

    // Apply search filter
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      result = result.filter(order => 
        order._id.toLowerCase().includes(lowerCaseSearchTerm) ||
        (order.customerName && order.customerName.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (order.tableId && order.tableId.toString().includes(lowerCaseSearchTerm))
      );
    }

    // Apply date range filter
    if (dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59); // Include the entire end day
      
      result = result.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      // Handle date comparison
      if (sortConfig.key === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      // Handle numeric comparison
      if (sortConfig.key === 'totalAmount') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    setFilteredOrders(result);
  };

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await orderAPI.updateOrderStatus(orderId, newStatus);
      
      // Update local state
      setOrders(prevOrders => {
        return prevOrders.map(order => {
          if (order._id === orderId) {
            return { ...order, status: newStatus };
          }
          return order;
        });
      });
      
      toast.success(`Order status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating order status:', err);
      toast.error('Failed to update order status');
    }
  };

  // Handler for "Generate Receipt" button
  const handlePrintReceipt = (orderId) => {
    // Find the order
    const order = orders.find(o => o._id === orderId);
    if (!order) {
      toast.error('Order not found');
      return;
    }
    
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
            background-color: #f59e0b;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            text-align: left;
            border-bottom: 1px solid #ddd;
            padding: 8px;
          }
          td {
            padding: 8px;
            border-bottom: 1px solid #eee;
          }
          .text-right {
            text-align: right;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Café Automation</h2>
          <p>Receipt</p>
        </div>
        
        <div class="order-info">
          <p><strong>Order #:</strong> ${order._id.slice(-6)}</p>
          <p><strong>Date:</strong> ${formatDate(order.createdAt)} ${formatTime(order.createdAt)}</p>
          <p><strong>Status:</strong> ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p>
          <p><strong>Table:</strong> ${getTableInfo(order.tableId)}</p>
          ${order.customerName ? `<p><strong>Customer:</strong> ${order.customerName}</p>` : ''}
        </div>
        
        <h3>Items</h3>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Price</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items && Array.isArray(order.items) ? order.items.map(item => {
              try {
                // Get item details safely
                let itemName = 'Unknown Item';
                let itemPrice = 0;
                let itemQuantity = 1;
                
                if (item.menuItem) {
                  if (typeof item.menuItem === 'object' && item.menuItem !== null) {
                    itemName = item.menuItem.name || 'Unknown Item';
                  } else if (typeof item.menuItem === 'string') {
                    itemName = `Menu Item #${item.menuItem.slice(-4)}`;
                  }
                } else if (item.menu && typeof item.menu === 'object' && item.menu !== null) {
                  itemName = item.menu.name || 'Unknown Item';
                } else if (item.name) {
                  itemName = item.name;
                }
                
                itemPrice = parseFloat(item.price) || 0;
                itemQuantity = parseInt(item.quantity) || 1;
                
                return `
                <tr>
                  <td>${itemName}</td>
                  <td class="text-right">${itemQuantity}</td>
                  <td class="text-right">₹${itemPrice.toFixed(2)}</td>
                  <td class="text-right">₹${(itemPrice * itemQuantity).toFixed(2)}</td>
                </tr>
                `;
              } catch (error) {
                console.error('Error rendering receipt item:', error);
                return `
                <tr>
                  <td>Error displaying item</td>
                  <td class="text-right">-</td>
                  <td class="text-right">₹0.00</td>
                  <td class="text-right">₹0.00</td>
                </tr>
                `;
              }
            }).join('') : ''}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" class="text-right"><strong>Total:</strong></td>
              <td class="text-right"><strong>₹${order.totalAmount ? order.totalAmount.toFixed(2) : calculateOrderTotal(order).toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>
        
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
    
    toast.success('Receipt generated successfully');
  };

  const exportToCSV = () => {
    // Create CSV content
    const headers = ['Order ID', 'Date', 'Time', 'Table', 'Customer', 'Items', 'Total', 'Status'];
    const csvRows = [headers];
    
    filteredOrders.forEach(order => {
      const date = new Date(order.createdAt);
      const dateStr = date.toLocaleDateString();
      const timeStr = date.toLocaleTimeString();
      
      const items = order.items.map(item => {
        const itemName = item.menuItem?.name || 'Unknown Item';
        return `${itemName} x${item.quantity}`;
      }).join(', ');
      
      const row = [
        order._id,
        dateStr,
        timeStr,
        order.tableId || 'N/A',
        order.customerName || 'N/A',
        items,
        `₹${order.totalAmount.toFixed(2)}`,
        order.status
      ];
      
      csvRows.push(row);
    });
    
    // Convert to CSV string
    const csvContent = csvRows.map(row => row.map(cell => 
      typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
    ).join(',')).join('\\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `order_history_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Order history exported to CSV');
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (dateString) => {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'denied':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to safely extract item details
  const getItemDetails = (item) => {
    let itemName = 'Unknown Item';
    let itemPrice = 0;
    let itemQuantity = 1;
    
    try {
      // Handle different item structures
      if (item.menuItem) {
        if (typeof item.menuItem === 'object' && item.menuItem !== null) {
          itemName = item.menuItem.name || 'Unknown Item';
        } else if (typeof item.menuItem === 'string') {
          // If menuItem is just an ID reference
          itemName = `Menu Item #${item.menuItem.slice(-4)}`;
        }
      } else if (item.menu && typeof item.menu === 'object' && item.menu !== null) {
        itemName = item.menu.name || 'Unknown Item';
      } else if (item.name) {
        itemName = item.name;
      }
      
      // Get price and quantity
      itemPrice = parseFloat(item.price) || 0;
      itemQuantity = parseInt(item.quantity) || 1;
    } catch (err) {
      console.error('Error parsing item:', err);
    }
    
    return { itemName, itemPrice, itemQuantity };
  };
  
  // Safely get table information
  const getTableInfo = (tableId) => {
    if (!tableId) return 'N/A';
    
    try {
      if (typeof tableId === 'object' && tableId !== null) {
        // Try to get table number from various possible properties
        if (tableId.number) return `Table ${tableId.number}`;
        if (tableId.tableNumber) return `Table ${tableId.tableNumber}`;
        if (tableId._id) return `Table ${tableId._id.toString().slice(-4)}`;
        return 'Table (Object)';
      } else {
        // Handle primitive values
        return `Table ${tableId}`;
      }
    } catch (err) {
      console.error('Error parsing table info:', err);
      return 'Table (Error)';
    }
  };
  
  const calculateOrderTotal = (order) => {
    if (!order.items || !Array.isArray(order.items)) return 0;
    
    return order.items.reduce((total, item) => {
      try {
        const { itemPrice, itemQuantity } = getItemDetails(item);
        return total + (itemPrice * itemQuantity);
      } catch (err) {
        console.error('Error calculating item total:', err);
        return total;
      }
    }, 0);
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 ml-0">Order History</h1>
          
          {/* Mobile-only quick actions */}
          <div className="flex sm:hidden space-x-2">
            <button
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className="p-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              aria-label="Toggle filters"
            >
              <Filter size={18} />
            </button>
            <button
              onClick={fetchOrders}
              className="p-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              aria-label="Refresh orders"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
        
        {/* Search and action buttons - responsive layout */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-md w-full text-sm"
              aria-label="Search orders"
            />
            <Search className="absolute left-3 top-3 text-gray-400" size={16} />
          </div>
          
          <div className="flex flex-wrap gap-2 sm:flex-nowrap">
            <button
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className="hidden sm:flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm flex-grow sm:flex-grow-0"
              aria-label="Toggle filters"
            >
              <Filter size={16} />
              <span>Filters</span>
            </button>
            
            <button
              onClick={exportToCSV}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-amber-600 text-white rounded-md hover:bg-amber-700 text-sm flex-grow sm:flex-grow-0"
              aria-label="Export to CSV"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
            
            <button
              onClick={fetchOrders}
              className="hidden sm:flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm flex-grow sm:flex-grow-0"
              aria-label="Refresh orders"
            >
              <RefreshCw size={16} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Filter Panel */}
      {isFilterPanelOpen && (
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md mb-6 border border-gray-200 fixed sm:relative inset-0 sm:inset-auto z-20 sm:z-auto overflow-auto sm:overflow-visible flex flex-col h-full sm:h-auto">
          <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pt-1 pb-2 border-b border-gray-100">
            <h2 className="text-lg font-semibold">Filter Orders</h2>
            <button 
              onClick={() => setIsFilterPanelOpen(false)}
              className="text-gray-500 hover:text-gray-700 p-1"
              aria-label="Close filter panel"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-grow">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-md w-full text-sm"
                />
                <Calendar className="absolute left-3 top-3 text-gray-400" size={16} />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-md w-full text-sm"
                />
                <Calendar className="absolute left-3 top-3 text-gray-400" size={16} />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-4 pr-10 py-2.5 border border-gray-300 rounded-md w-full text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="completed">Completed</option>
                <option value="denied">Denied</option>
              </select>
            </div>
          </div>
          
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end mt-4 gap-3 pt-3 border-t border-gray-100 sticky bottom-0 bg-white">
            <button
              onClick={() => {
                setDateRange({ start: '', end: '' });
                setStatusFilter('all');
              }}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm w-full sm:w-auto"
            >
              Reset
            </button>
            <button
              onClick={() => {
                applyFilters();
                setIsFilterPanelOpen(false);
              }}
              className="px-4 py-2.5 bg-amber-600 text-white rounded-md hover:bg-amber-700 text-sm w-full sm:w-auto"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      {/* Sort Controls - Visible only on larger screens */}
      <div className="hidden md:flex bg-white rounded-lg shadow-md p-3 mb-4 text-xs font-medium text-gray-500 uppercase">
        <div 
          className="flex items-center cursor-pointer px-4 py-2 hover:bg-gray-50 rounded-md"
          onClick={() => handleSort('_id')}
        >
          <span>Order ID</span>
          {sortConfig.key === '_id' && (
            sortConfig.direction === 'asc' ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />
          )}
        </div>
        <div 
          className="flex items-center cursor-pointer px-4 py-2 hover:bg-gray-50 rounded-md"
          onClick={() => handleSort('createdAt')}
        >
          <span>Date & Time</span>
          {sortConfig.key === 'createdAt' && (
            sortConfig.direction === 'asc' ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />
          )}
        </div>
        <div 
          className="flex items-center cursor-pointer px-4 py-2 hover:bg-gray-50 rounded-md ml-auto"
          onClick={() => handleSort('totalAmount')}
        >
          <span>Total</span>
          {sortConfig.key === 'totalAmount' && (
            sortConfig.direction === 'asc' ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />
          )}
        </div>
        <div 
          className="flex items-center cursor-pointer px-4 py-2 hover:bg-gray-50 rounded-md"
          onClick={() => handleSort('status')}
        >
          <span>Status</span>
          {sortConfig.key === 'status' && (
            sortConfig.direction === 'asc' ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />
          )}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
            No orders found matching your criteria
          </div>
        ) : (
          filteredOrders.map(order => (
            <div key={order._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Mobile Card View */}
              <div className={`md:hidden p-4 ${expandedOrderId === order._id ? 'bg-amber-50' : ''}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-medium text-gray-900">
                      Order #{order._id.substring(order._id.length - 6)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center">
                      <Calendar size={14} className="mr-1" />
                      {formatDate(order.createdAt)}
                      <Clock size={14} className="ml-2 mr-1" />
                      {formatTime(order.createdAt)}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <div className="text-gray-500">Table:</div>
                    <div>{getTableInfo(order.tableId)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Customer:</div>
                    <div>{order.customerName || 'Anonymous'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Total:</div>
                    <div className="font-medium">₹{order.totalAmount ? order.totalAmount.toFixed(2) : calculateOrderTotal(order).toFixed(2)}</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)}
                    className="text-sm px-3 py-1.5 border border-amber-600 text-amber-600 rounded-md hover:bg-amber-50"
                  >
                    {expandedOrderId === order._id ? 'Hide Details' : 'View Details'}
                  </button>
                  <button
                    onClick={() => {
                      setExpandedOrderId(order._id);
                      setTimeout(handlePrintReceipt, 100);
                    }}
                    className="text-sm px-3 py-1.5 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 flex items-center gap-1"
                  >
                    <Printer size={14} />
                    <span>Receipt</span>
                  </button>
                </div>
              </div>
              
              {/* Desktop Table Row */}
              <div className="hidden md:block hover:bg-gray-50">
                <div className={`grid grid-cols-7 px-6 py-4 ${expandedOrderId === order._id ? 'bg-amber-50' : ''}`}>
                  <div className="text-sm font-medium text-gray-900">
                    {order._id.substring(order._id.length - 8)}
                  </div>
                  <div className="col-span-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-1 text-gray-400" />
                      <span>{formatDate(order.createdAt)}</span>
                      <Clock size={16} className="ml-2 mr-1 text-gray-400" />
                      <span>{formatTime(order.createdAt)}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {getTableInfo(order.tableId)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {order.customerName || 'Anonymous'}
                    {order.customerPhone && <div className="text-xs text-gray-400">{order.customerPhone}</div>}
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    ₹{order.totalAmount ? order.totalAmount.toFixed(2) : calculateOrderTotal(order).toFixed(2)}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)}
                        className="text-amber-600 hover:text-amber-900"
                      >
                        {expandedOrderId === order._id ? 'Hide' : 'View'}
                      </button>
                      <button
                        onClick={() => {
                          setExpandedOrderId(order._id);
                          setTimeout(handlePrintReceipt, 100);
                        }}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Printer size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {/* Expanded Order Details - Both Mobile and Desktop */}
              {expandedOrderId === order._id && (
                <div className="p-4 bg-amber-50 border-t border-amber-100">
                  {/* Mobile View */}
                  <div className="md:hidden space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Order Details</h3>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-sm text-gray-500">Order ID:</div>
                          <div className="text-sm font-medium break-all">{order._id}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-sm text-gray-500">Date & Time:</div>
                          <div className="text-sm font-medium">
                            {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-sm text-gray-500">Table:</div>
                          <div className="text-sm font-medium">
                            {getTableInfo(order.tableId)}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-sm text-gray-500">Customer:</div>
                          <div className="text-sm font-medium">
                            {order.customerName || 'Anonymous'}
                            {order.customerPhone && <div className="text-xs text-gray-500">{order.customerPhone}</div>}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-sm text-gray-500">Status:</div>
                          <div>
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order._id, e.target.value)}
                              className="text-sm border border-gray-300 rounded px-2 py-1 w-full"
                            >
                              <option value="pending">Pending</option>
                              <option value="preparing">Preparing</option>
                              <option value="ready">Ready</option>
                              <option value="completed">Completed</option>
                              <option value="denied">Denied</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Order Items</h3>
                      <div className="space-y-2">
                        {order.items && Array.isArray(order.items) && order.items.map((item, index) => {
                          try {
                            const { itemName, itemPrice, itemQuantity } = getItemDetails(item);
                            
                            return (
                              <div key={index} className="flex justify-between py-1 border-b border-gray-100">
                                <div className="text-sm">
                                  <span className="font-medium">{itemName}</span>
                                  <span className="text-gray-500 ml-2">x{itemQuantity}</span>
                                </div>
                                <div className="text-sm font-medium">
                                  ₹{(itemPrice * itemQuantity).toFixed(2)}
                                </div>
                              </div>
                            );
                          } catch (err) {
                            console.error('Error rendering item:', err);
                            return (
                              <div key={index} className="flex justify-between py-1 border-b border-gray-100">
                                <div className="text-sm text-red-500">Error displaying item</div>
                                <div className="text-sm">₹0.00</div>
                              </div>
                            );
                          }
                        })}
                        
                        <div className="flex justify-between pt-2 font-semibold">
                          <div>Total</div>
                          <div>₹{order.totalAmount ? order.totalAmount.toFixed(2) : calculateOrderTotal(order).toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-3 pt-3 border-t border-amber-100">
                      <button
                        onClick={() => handlePrintReceipt(order._id)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-md hover:bg-amber-700 w-full"
                      >
                        <Printer size={16} />
                        <span>Print Receipt</span>
                      </button>
                      <button
                        onClick={() => setExpandedOrderId(null)}
                        className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 w-full"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                  
                  {/* Desktop View */}
                  <div className="hidden md:block">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Order Details</h3>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-sm text-gray-500">Order ID:</div>
                            <div className="text-sm font-medium">{order._id}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-sm text-gray-500">Date & Time:</div>
                            <div className="text-sm font-medium">
                              {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-sm text-gray-500">Table:</div>
                            <div className="text-sm font-medium">
                              {getTableInfo(order.tableId)}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-sm text-gray-500">Customer:</div>
                            <div className="text-sm font-medium">
                              {order.customerName || 'Anonymous'}
                              {order.customerPhone && <div className="text-xs text-gray-500">{order.customerPhone}</div>}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-sm text-gray-500">Status:</div>
                            <div>
                              <select
                                value={order.status}
                                onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                className="text-sm border border-gray-300 rounded px-2 py-1"
                              >
                                <option value="pending">Pending</option>
                                <option value="preparing">Preparing</option>
                                <option value="ready">Ready</option>
                                <option value="completed">Completed</option>
                                <option value="denied">Denied</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Order Items</h3>
                        <div className="space-y-2">
                          {order.items && Array.isArray(order.items) && order.items.map((item, index) => {
                            try {
                              const { itemName, itemPrice, itemQuantity } = getItemDetails(item);
                              
                              return (
                                <div key={index} className="flex justify-between py-1 border-b border-gray-100">
                                  <div className="text-sm">
                                    <span className="font-medium">{itemName}</span>
                                    <span className="text-gray-500 ml-2">x{itemQuantity}</span>
                                  </div>
                                  <div className="text-sm font-medium">
                                    ₹{(itemPrice * itemQuantity).toFixed(2)}
                                  </div>
                                </div>
                              );
                            } catch (err) {
                              console.error('Error rendering item:', err);
                              return (
                                <div key={index} className="flex justify-between py-1 border-b border-gray-100">
                                  <div className="text-sm text-red-500">Error displaying item</div>
                                  <div className="text-sm">₹0.00</div>
                                </div>
                              );
                            }
                          })}
                          
                          <div className="flex justify-between pt-2 font-semibold">
                            <div>Total</div>
                            <div>₹{order.totalAmount ? order.totalAmount.toFixed(2) : calculateOrderTotal(order).toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end space-x-3">
                      <button
                        onClick={() => handlePrintReceipt(order._id)}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
                      >
                        <Printer size={16} />
                        <span>Print Receipt</span>
                      </button>
                      <button
                        onClick={() => setExpandedOrderId(null)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* No hidden receipt needed with the new approach */}
    </div>
  );
};

export default OrderHistoryPage;
