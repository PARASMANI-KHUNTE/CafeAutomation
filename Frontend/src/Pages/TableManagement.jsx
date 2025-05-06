import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash2, QrCode, Download } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { QRCodeCanvas } from 'qrcode.react';
import { saveAs } from 'file-saver';
import axios from 'axios';

const TableManagement = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentTable, setCurrentTable] = useState(null);
  const [tableNumber, setTableNumber] = useState('');
  const [tableStatus, setTableStatus] = useState('available');
  const [capacity, setCapacity] = useState(4);
  const [location, setLocation] = useState('indoor');
  
  // QR Code modal state
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  
  // Load tables when component mounts
  useEffect(() => {
    fetchTables();
  }, []);
  
  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/api/tables');
      setTables(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load tables');
      console.error('Error loading tables:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (editMode && currentTable) {
        // Update existing table
        await axios.put(`http://localhost:8000/api/tables/${currentTable._id}`, {
          tableNumber: parseInt(tableNumber),
          status: tableStatus,
          capacity: parseInt(capacity),
          location
        });
      } else {
        // Create new table
        await axios.post('http://localhost:8000/api/tables', {
          tableNumber: parseInt(tableNumber),
          capacity: parseInt(capacity),
          location
        });
      }
      
      // Reset form
      resetForm();
      
      // Refresh tables
      fetchTables();
      
    } catch (err) {
      setError(editMode ? 'Failed to update table' : 'Failed to create table');
      console.error('Error saving table:', err);
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
  
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this table?')) return;
    
    try {
      setLoading(true);
      await axios.delete(`http://localhost:8000/api/tables/${id}`);
      fetchTables();
    } catch (err) {
      setError('Failed to delete table');
      console.error('Error deleting table:', err);
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
  
  const handleShowQR = (table) => {
    setSelectedTable(table);
    setShowQRModal(true);
  };
  
  const downloadQRCode = () => {
    if (!selectedTable) return;
    
    const canvas = document.getElementById('table-qrcode');
    canvas.toBlob(function(blob) {
      saveAs(blob, `table-${selectedTable.tableNumber}-qrcode.png`);
    });
  };
  
  return (
    <AdminLayout showFloatingBtn={false}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Table Management</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            <PlusCircle size={18} className="mr-2" />
            Add New Table
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg">
            {error}
          </div>
        )}
        
        {/* Table Form */}
        {showForm && (
          <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <h2 className="text-lg font-semibold mb-4">
              {editMode ? 'Edit Table' : 'Add New Table'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Table Number
                  </label>
                  <input
                    type="number"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                    <option value="balcony">Balcony</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                
                {editMode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={tableStatus}
                      onChange={(e) => setTableStatus(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="available">Available</option>
                      <option value="occupied">Occupied</option>
                      <option value="reserved">Reserved</option>
                    </select>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end mt-4 space-x-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : editMode ? 'Update Table' : 'Create Table'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Tables List */}
        {loading && !tables.length ? (
          <div className="text-center py-8">Loading tables...</div>
        ) : !tables.length ? (
          <div className="text-center py-8 text-gray-500">
            No tables found. Add your first table to get started.
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tables.map((table) => (
                  <tr key={table._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{table.tableNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        table.status === 'available' ? 'bg-green-100 text-green-800' :
                        table.status === 'occupied' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{table.capacity || 4}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {table.location ? table.location.charAt(0).toUpperCase() + table.location.slice(1) : 'Indoor'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button 
                        onClick={() => handleEdit(table)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(table._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                      <button 
                        onClick={() => handleShowQR(table)}
                        className="text-green-600 hover:text-green-900"
                      >
                        QR Code
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* QR Code Modal */}
        {showQRModal && selectedTable && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  Table {selectedTable.tableNumber} QR Code
                </h2>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>
              
              <div className="flex flex-col items-center mb-4">
                <QRCodeCanvas
                  id="table-qrcode"
                  value={selectedTable.qrCode}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
                <p className="mt-2 text-sm text-gray-600">
                  Scan this QR code to access the menu for Table {selectedTable.tableNumber}
                </p>
              </div>
              
              <button
                onClick={downloadQRCode}
                className="w-full flex items-center justify-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                <Download size={18} className="mr-2" />
                Download QR Code
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default TableManagement;
