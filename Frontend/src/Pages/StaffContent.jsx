import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { authAPI } from '../services/api';

const StaffContent = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'staff'
  });
  const [editingId, setEditingId] = useState(null);

  // Fetch staff members
  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getAllUsers();
      setStaff(response.filter(user => user.role === 'staff'));
    } catch (err) {
      setError('Failed to fetch staff members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);

      if (editingId) {
        // Prepare update data (skip password if blank)
        const updateData = {
          username: formData.username,
          email: formData.email,
          role: formData.role
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await authAPI.updateUser(editingId, updateData);
      } else {
        await authAPI.register(formData);
      }

      closeModal();
      fetchStaff();

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save staff');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (staffMember) => {
    setFormData({
      username: staffMember.username,
      email: staffMember.email,
      password: '',
      role: staffMember.role
    });
    setEditingId(staffMember._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        setLoading(true);
        await authAPI.deleteUser(id);
        fetchStaff();
      } catch (err) {
        setError('Failed to delete staff member');
      } finally {
        setLoading(false);
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ username: '', email: '', password: '', role: 'staff' });
    setEditingId(null);
    setError('');
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Staff Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-amber-700 transition text-sm sm:text-base"
        >
          <Plus size={20} /> Add Staff
        </button>
      </div>
  
      {/* Error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 animate-pulse">
          {error}
        </div>
      )}
  
      {/* Staff List */}
      {loading ? (
        <p className="text-center py-10">Loading...</p>
      ) : staff.length === 0 ? (
        <p className="text-center py-10 text-gray-500">No staff members found</p>
      ) : (
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {staff.map((member) => (
            <div key={member._id} className="bg-white rounded-xl shadow-md p-4 space-y-2">
              <h3 className="text-lg font-semibold text-gray-800">{member.username}</h3>
              <p className="text-sm text-gray-600">{member.email}</p>
              <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                {member.role}
              </span>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => handleEdit(member)}
                  className="text-amber-600 hover:text-amber-900"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(member._id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
  
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn px-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl animate-slideIn">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold">
                {editingId ? 'Edit Staff Member' : 'Add New Staff'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
  
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
  
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
  
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!editingId}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                />
                {editingId && (
                  <p className="mt-1 text-sm text-gray-500">Leave blank to keep current password</p>
                )}
              </div>
  
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingId ? 'Update' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
  
};

export default StaffContent;
