import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash2, Calendar, Clock, Tag, Percent, Package, FileText, ShoppingBag } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { menuAPI } from '../services/api';
import { categoryAPI } from '../services/api';
import { discountAPI } from '../services/discountAPI';
import { toast } from 'react-hot-toast';
// Using native Date formatting instead of date-fns

const DiscountManagement = () => {
  // State for discounts list
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for discount form
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentDiscount, setCurrentDiscount] = useState(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState('percentage'); // percentage, fixed
  const [discountValue, setDiscountValue] = useState('');
  const [applicableType, setApplicableType] = useState('item'); // item, category, bill, price_range
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [minPurchaseAmount, setMinPurchaseAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  // Additional state for menu items and categories
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Load discounts, menu items, and categories when component mounts
  useEffect(() => {
    fetchDiscounts();
    fetchMenuItems();
    fetchCategories();
  }, []);
  
  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const data = await discountAPI.getAllDiscounts();
      setDiscounts(data);
      setError('');
    } catch (err) {
      console.error('Error fetching discounts:', err);
      setError('Failed to load discounts. Please try again.');
      toast.error('Failed to load discounts');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchMenuItems = async () => {
    try {
      const data = await menuAPI.getAllMenu();
      setMenuItems(data);
    } catch (err) {
      console.error('Error fetching menu items:', err);
      toast.error('Failed to load menu items');
    }
  };
  
  const fetchCategories = async () => {
    try {
      const data = await categoryAPI.getAllCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      toast.error('Failed to load categories');
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const discountData = {
        name,
        description,
        discountType,
        discountValue: parseFloat(discountValue),
        applicableType,
        isActive,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
      };
      
      // Add applicable items based on type
      if (applicableType === 'item') {
        discountData.applicableItems = selectedItems;
      } else if (applicableType === 'category') {
        discountData.applicableCategories = selectedCategories;
      } else if (applicableType === 'price_range') {
        discountData.minPurchaseAmount = parseFloat(minPurchaseAmount);
      }
      
      if (editMode && currentDiscount) {
        await discountAPI.updateDiscount(currentDiscount._id, discountData);
        toast.success('Discount updated successfully');
      } else {
        await discountAPI.createDiscount(discountData);
        toast.success('Discount created successfully');
      }
      
      resetForm();
      fetchDiscounts();
    } catch (err) {
      console.error('Error saving discount:', err);
      setError('Failed to save discount. Please try again.');
      toast.error('Failed to save discount');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEdit = (discount) => {
    setCurrentDiscount(discount);
    setName(discount.name);
    setDescription(discount.description || '');
    setDiscountType(discount.discountType);
    setDiscountValue(discount.discountValue.toString());
    setApplicableType(discount.applicableType);
    setIsActive(discount.isActive);
    
    if (discount.startDate) {
      const startDateObj = new Date(discount.startDate);
      setStartDate(startDateObj.toISOString().slice(0, 16));
    }
    
    if (discount.endDate) {
      const endDateObj = new Date(discount.endDate);
      setEndDate(endDateObj.toISOString().slice(0, 16));
    }
    
    if (discount.applicableType === 'item' && discount.applicableItems) {
      setSelectedItems(discount.applicableItems);
    }
    
    if (discount.applicableType === 'category' && discount.applicableCategories) {
      setSelectedCategories(discount.applicableCategories);
    }
    
    if (discount.applicableType === 'price_range' && discount.minPurchaseAmount) {
      setMinPurchaseAmount(discount.minPurchaseAmount.toString());
    }
    
    setEditMode(true);
    setShowForm(true);
  };
  
  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await discountAPI.deleteDiscount(id);
      fetchDiscounts();
      toast.success('Discount deleted successfully');
    } catch (err) {
      console.error('Error deleting discount:', err);
      setError('Failed to delete discount');
      toast.error('Failed to delete discount');
    } finally {
      setLoading(false);
    }
  };
  
  const resetForm = () => {
    setCurrentDiscount(null);
    setName('');
    setDescription('');
    setDiscountType('percentage');
    setDiscountValue('');
    setApplicableType('item');
    setSelectedItems([]);
    setSelectedCategories([]);
    setMinPurchaseAmount('');
    setStartDate('');
    setEndDate('');
    setIsActive(true);
    setEditMode(false);
    setShowForm(false);
  };
  
  // Toggle discount active status
  const toggleDiscountStatus = async (discount) => {
    setLoading(true);
    try {
      const newStatus = !discount.isActive;
      await discountAPI.toggleDiscountStatus(discount._id, newStatus);
      
      // Update the local state
      setDiscounts(discounts.map(d => 
        d._id === discount._id ? { ...d, isActive: newStatus } : d
      ));
      
      // Show success notification
      if (newStatus) {
        toast.success(`${discount.name} has been activated`);
      } else {
        toast.success(`${discount.name} has been deactivated`);
      }
    } catch (err) {
      console.error('Error toggling discount status:', err);
      toast.error('Failed to update discount status');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to get discount status
  const getDiscountStatus = (discount) => {
    const now = new Date();
    
    if (!discount.isActive) {
      return 'inactive';
    }
    
    if (discount.startDate && new Date(discount.startDate) > now) {
      return 'scheduled';
    }
    
    if (discount.endDate && new Date(discount.endDate) < now) {
      return 'expired';
    }
    
    return 'active';
  };
  
  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  // Helper function to get icon based on applicable type
  const getApplicableTypeIcon = (type) => {
    switch (type) {
      case 'item':
        return <ShoppingBag size={16} className="mr-1" />;
      case 'category':
        return <Package size={16} className="mr-1" />;
      case 'bill':
        return <FileText size={16} className="mr-1" />;
      case 'price_range':
        return <Tag size={16} className="mr-1" />;
      default:
        return <Percent size={16} className="mr-1" />;
    }
  };
  
  return (
    <AdminLayout showFloatingBtn={false}>
      <div className="bg-gray-50 min-h-screen">
        <div className="flex flex-wrap justify-center gap-3 max-w-md mx-auto pt-4 pb-3">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center justify-center px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm flex-1"
            aria-label="Add New Discount"
          >
            <PlusCircle size={16} className="mr-1.5" />
            <span>Add New Discount</span>
          </button>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {/* Discount Form */}
        {showForm && (
          <div className="mb-4 p-3 sm:p-4 bg-amber-50 rounded-lg border border-amber-200 shadow-sm mx-2">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold">
                {editMode ? 'Edit Discount' : 'Add New Discount'}
              </h2>
              <button
                type="button"
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-amber-100"
                aria-label="Close form"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Discount Name*
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Summer Sale"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Special discount for summer"
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Discount Type*
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-amber-500 focus:border-amber-500"
                    required
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Discount Value*
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step={discountType === 'percentage' ? '1' : '0.01'}
                      max={discountType === 'percentage' ? '100' : '100000'}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-amber-500 focus:border-amber-500"
                      placeholder={discountType === 'percentage' ? '10' : '100'}
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      {discountType === 'percentage' ? '%' : '₹'}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Applicable To*
                  </label>
                  <select
                    value={applicableType}
                    onChange={(e) => setApplicableType(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-amber-500 focus:border-amber-500"
                    required
                  >
                    <option value="item">Specific Items</option>
                    <option value="category">Categories</option>
                    <option value="bill">Entire Bill</option>
                    <option value="price_range">Minimum Purchase Amount</option>
                  </select>
                </div>
                
                {applicableType === 'item' && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Select Items
                    </label>
                    <select
                      multiple
                      value={selectedItems}
                      onChange={(e) => {
                        const values = Array.from(e.target.selectedOptions, option => option.value);
                        setSelectedItems(values);
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-amber-500 focus:border-amber-500 h-24"
                    >
                      {menuItems.map(item => (
                        <option key={item._id} value={item._id}>
                          {item.name} - ₹{item.price}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple items</p>
                  </div>
                )}
                
                {applicableType === 'category' && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Select Categories
                    </label>
                    <select
                      multiple
                      value={selectedCategories}
                      onChange={(e) => {
                        const values = Array.from(e.target.selectedOptions, option => option.value);
                        setSelectedCategories(values);
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-amber-500 focus:border-amber-500 h-24"
                    >
                      {categories.map(category => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple categories</p>
                  </div>
                )}
                
                {applicableType === 'price_range' && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Minimum Purchase Amount (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={minPurchaseAmount}
                      onChange={(e) => setMinPurchaseAmount(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-amber-500 focus:border-amber-500"
                      placeholder="500"
                      required={applicableType === 'price_range'}
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                
                <div className="sm:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>
              
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end mt-4 gap-2 sm:space-x-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm sm:text-base w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm sm:text-base w-full sm:w-auto mb-2 sm:mb-0 flex items-center justify-center"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      {editMode ? (
                        <>
                          <Edit size={16} className="mr-1.5" />
                          Update Discount
                        </>
                      ) : (
                        <>
                          <PlusCircle size={16} className="mr-1.5" />
                          Create Discount
                        </>
                      )}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Discounts List */}
        {loading && !discounts.length ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-600 mx-auto mb-2"></div>
            <p>Loading discounts...</p>
          </div>
        ) : !discounts.length ? (
          <div className="text-center py-8 text-gray-500">
            <div className="bg-gray-100 p-6 rounded-lg max-w-md mx-auto">
              <div className="text-amber-600 mb-2">
                <Percent size={32} className="mx-auto" />
              </div>
              <p className="mb-2">No discounts found. Add your first discount to get started.</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm"
              >
                Add Discount
              </button>
            </div>
          </div>
        ) : (
          <div className="px-2 py-2">
            {discounts.map((discount) => {
              const status = getDiscountStatus(discount);
              
              return (
                <div key={discount._id} className="bg-white rounded-lg shadow-sm mb-3">
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-lg font-semibold text-gray-900 flex items-center">
                          {discount.name}
                          <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                            status === 'active' ? 'bg-green-100 text-green-800' :
                            status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                            status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {discount.description}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="inline-flex items-center px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs">
                            <Percent size={14} className="mr-1" />
                            {discount.discountType === 'percentage' 
                              ? `${discount.discountValue}% off` 
                              : `₹${discount.discountValue} off`}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                            {getApplicableTypeIcon(discount.applicableType)}
                            {discount.applicableType === 'item' 
                              ? 'Specific Items' 
                              : discount.applicableType === 'category'
                                ? 'Categories'
                                : discount.applicableType === 'bill'
                                  ? 'Entire Bill'
                                  : `Min. ₹${discount.minPurchaseAmount}`}
                          </span>
                          {(discount.startDate || discount.endDate) && (
                            <span className="inline-flex items-center px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
                              <Calendar size={14} className="mr-1" />
                              {discount.startDate 
                                ? (discount.endDate 
                                  ? `${formatDate(discount.startDate)} - ${formatDate(discount.endDate)}`
                                  : `From ${formatDate(discount.startDate)}`)
                                : (discount.endDate
                                  ? `Until ${formatDate(discount.endDate)}`
                                  : 'No time limit')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-4 space-x-2">
                      <button 
                        onClick={() => toggleDiscountStatus(discount)}
                        className={`flex items-center justify-center px-3 py-1 rounded text-xs ${discount.isActive ? 'bg-gray-50 text-gray-600 hover:bg-gray-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                      >
                        <span>{discount.isActive ? 'Deactivate' : 'Activate'}</span>
                      </button>
                      <button 
                        onClick={() => handleEdit(discount)}
                        className="flex items-center justify-center px-3 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 text-xs"
                      >
                        <span>Edit</span>
                      </button>
                      <button 
                        onClick={() => handleDelete(discount._id)}
                        className="flex items-center justify-center px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 text-xs"
                      >
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default DiscountManagement;
