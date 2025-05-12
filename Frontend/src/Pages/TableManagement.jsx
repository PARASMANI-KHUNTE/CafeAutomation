import React, { useState, useEffect } from 'react';
import { PlusCircle, QrCode, Download, Edit, Trash2, X, AlertTriangle } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { QRCodeCanvas } from 'qrcode.react';
import axios from 'axios';
import config from '../config';
import { toast } from 'react-hot-toast';

const TableManagement = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showTableQRModal, setShowTableQRModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentTable, setCurrentTable] = useState(null);
  const [tableNumber, setTableNumber] = useState('');
  const [tableStatus, setTableStatus] = useState('available');
  const [capacity, setCapacity] = useState(4);
  const [location, setLocation] = useState('indoor');
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);

  // Load tables when component mounts
  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${config.API_URL}/tables`);
      setTables(response.data);
      setError('');
      toast.success('Tables loaded successfully');
    } catch (err) {
      console.error('Error fetching tables:', err);
      setError('Failed to load tables. Please try again.');
      toast.error('Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const tableData = {
        tableNumber: parseInt(tableNumber),
        capacity: parseInt(capacity),
        location,
        status: tableStatus
      };

      if (editMode && currentTable) {
        await axios.put(`${config.API_URL}/tables/${currentTable._id}`, tableData);
        resetForm();
        fetchTables();
        setError('');
        toast.success('Table updated successfully');
      } else {
        await axios.post(`${config.API_URL}/tables`, tableData);
        resetForm();
        fetchTables();
        setError('');
        toast.success('Table created successfully');
      }
    } catch (err) {
      console.error('Error saving table:', err);
      setError('Failed to save table. Please try again.');
      toast.error('Failed to save table');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (table) => {
    setCurrentTable(table);
    setTableNumber(table.tableNumber.toString());
    setTableStatus(table.status);
    setCapacity(table.capacity || 4);
    setLocation(table.location || 'indoor');
    setEditMode(true);
    setShowForm(true);
  };

  const handleDelete = (table) => {
    setSelectedTable(table);
    setSelectedTableId(table._id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    setError('');
    try {
      await axios.delete(`${config.API_URL}/tables/${selectedTableId}`);
      fetchTables();
      setShowDeleteModal(false);
      toast.success('Table deleted successfully');
    } catch (err) {
      console.error('Error deleting table:', err);
      setError('Failed to delete table');
      toast.error('Failed to delete table');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentTable(null);
    setTableNumber('');
    setTableStatus('available');
    setCapacity(4);
    setLocation('indoor');
    setEditMode(false);
    setShowForm(false);
  };

  const handleShowLandingPageQR = () => {
    setShowQRModal(true);
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById('landing-page-qrcode');
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = 'cafe-landing-page-qr.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const downloadTableQRCode = () => {
    const canvas = document.getElementById('table-qrcode');
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `table-${selectedTable?.tableNumber}-qr.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <AdminLayout showFloatingBtn={false}>
      <div className="bg-gray-50 min-h-screen">
        <div className="flex flex-wrap justify-center gap-3 max-w-md mx-auto pt-4 pb-3">
          <button
            onClick={handleShowLandingPageQR}
            className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex-1"
            aria-label="Generate QR Code"
          >
            <QrCode size={16} className="mr-1.5" />
            <span>Generate QR Code</span>
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center justify-center px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm flex-1"
            aria-label="Add New Table"
          >
            <PlusCircle size={16} className="mr-1.5" />
            <span>Add New Table</span>
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg">
            {error}
          </div>
        )}
        
        {/* Table Form */}
        {showForm && (
          <div className="mb-4 p-3 sm:p-4 bg-amber-50 rounded-lg border border-amber-200 shadow-sm">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold">
                {editMode ? 'Edit Table' : 'Add New Table'}
              </h2>
              <button
                type="button"
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-amber-100"
                aria-label="Close form"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Table Number
                  </label>
                  <input
                    type="number"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Enter table number"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Number of seats"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                    <option value="balcony">Balcony</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                
                {editMode && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={tableStatus}
                      onChange={(e) => setTableStatus(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-amber-500 focus:border-amber-500"
                    >
                      <option value="available">Available</option>
                      <option value="occupied">Occupied</option>
                      <option value="reserved">Reserved</option>
                    </select>
                  </div>
                )}
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
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm sm:text-base w-full sm:w-auto mb-2 sm:mb-0"
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
                          Update Table
                        </>
                      ) : (
                        <>
                          <PlusCircle size={16} className="mr-1.5" />
                          Create Table
                        </>
                      )}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Tables List */}
        {loading && !tables.length ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-600 mx-auto mb-2"></div>
            <p>Loading tables...</p>
          </div>
        ) : !tables.length ? (
          <div className="text-center py-8 text-gray-500">
            <div className="bg-gray-100 p-6 rounded-lg max-w-md mx-auto">
              <div className="text-amber-600 mb-2">
                <PlusCircle size={32} className="mx-auto" />
              </div>
              <p className="mb-2">No tables found. Add your first table to get started.</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm"
              >
                Add Table
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Table List */}
            
            <div className="px-2 py-2">
              {tables.map((table) => (
                <div key={table._id} className="bg-white rounded-lg shadow-sm mb-3">
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-lg font-semibold text-gray-900">Table {table.tableNumber}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {table.location ? table.location.charAt(0).toUpperCase() + table.location.slice(1) : 'Indoor'} • Capacity: {table.capacity || 4}
                        </div>
                      </div>
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        table.status === 'available' ? 'bg-green-100 text-green-800' :
                        table.status === 'occupied' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="flex justify-end mt-4 space-x-2">
                      <button 
                        onClick={() => handleEdit(table)}
                        className="flex items-center justify-center px-3 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 text-xs"
                      >
                        <span>Edit</span>
                      </button>
                      <button 
                        onClick={() => handleDelete(table)}
                        className="flex items-center justify-center px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 text-xs"
                      >
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Table QR Code Modal */}
        {showTableQRModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full shadow-xl">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                  Table {selectedTable?.tableNumber} QR Code
                </h2>
                <button
                  onClick={() => setShowTableQRModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex flex-col items-center mb-4">
                <div className="bg-white p-2 sm:p-3 rounded-lg shadow-sm border border-gray-200">
                  <QRCodeCanvas
                    id="table-qrcode"
                    value={`${window.location.origin}/table/${selectedTable?.tableNumber}`}
                    size={180}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <p className="mt-3 text-sm text-gray-600 text-center">
                  Scan this QR code to access Table {selectedTable?.tableNumber}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={downloadTableQRCode}
                  className="flex-1 flex items-center justify-center px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm sm:text-base"
                  aria-label="Download QR Code"
                >
                  <Download size={16} className="mr-2" />
                  Download QR Code
                </button>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/table/${selectedTable?.tableNumber}`;
                    navigator.clipboard.writeText(url);
                    toast.success(`Table URL copied to clipboard`);
                  }}
                  className="flex-1 flex items-center justify-center px-4 py-2.5 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 text-sm sm:text-base"
                  aria-label="Copy URL"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy URL
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full shadow-xl">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
                  <AlertTriangle size={20} className="text-red-600 mr-2" />
                  Confirm Delete
                </h2>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>
              
              <p className="mb-4 text-gray-600 text-sm sm:text-base">
                Are you sure you want to delete this table? This action cannot be undone.
              </p>
              
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:space-x-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm sm:text-base w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm sm:text-base w-full sm:w-auto mb-2 sm:mb-0 flex items-center justify-center"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <Trash2 size={16} className="mr-1.5" />
                      Delete
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Landing Page QR Code Modal */}
        {showQRModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full shadow-xl">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                  Cafe Landing Page QR Code
                </h2>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex flex-col items-center mb-4">
                <div className="bg-white p-2 sm:p-3 rounded-lg shadow-sm border border-gray-200">
                  <QRCodeCanvas
                    id="landing-page-qrcode"
                    value={`${window.location.origin}`}
                    size={180}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <p className="mt-3 text-sm text-gray-600 text-center">
                  Scan this QR code to access the cafe landing page
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={downloadQRCode}
                  className="flex-1 flex items-center justify-center px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm sm:text-base"
                  aria-label="Download QR Code"
                >
                  <Download size={16} className="mr-2" />
                  Download QR Code
                </button>
                <button
                  onClick={() => {
                    const url = window.location.origin;
                    navigator.clipboard.writeText(url);
                    toast.success('Cafe landing page URL copied to clipboard');
                  }}
                  className="flex-1 flex items-center justify-center px-4 py-2.5 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 text-sm sm:text-base"
                  aria-label="Copy URL"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy URL
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default TableManagement;
