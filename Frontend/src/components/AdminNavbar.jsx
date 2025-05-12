import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { BarChart2, Users, Coffee, LogOut, Table2, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminNavbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="bg-amber-800 text-white h-screen w-64 fixed left-0 top-0 shadow-lg">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-8">Café Admin</h1>
        <nav className="space-y-2">
          <NavLink
            to="/home/dashboard"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-amber-700 text-white' 
                  : 'text-amber-100 hover:bg-amber-700 hover:text-white'
              }`
            }
          >
            <BarChart2 className="mr-3" size={20} />
            <span>Dashboard</span>
          </NavLink>
          
          <NavLink
            to="/home/menu"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-amber-700 text-white' 
                  : 'text-amber-100 hover:bg-amber-700 hover:text-white'
              }`
            }
          >
            <Coffee className="mr-3" size={20} />
            <span>Menu Management</span>
          </NavLink>
          
          <NavLink
            to="/home/categories"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-amber-700 text-white' 
                  : 'text-amber-100 hover:bg-amber-700 hover:text-white'
              }`
            }
          >
            <Tag className="mr-3" size={20} />
            <span>Categories</span>
          </NavLink>
          
          <NavLink
            to="/home/staff"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-amber-700 text-white' 
                  : 'text-amber-100 hover:bg-amber-700 hover:text-white'
              }`
            }
          >
            <Users className="mr-3" size={20} />
            <span>Staff Management</span>
          </NavLink>
          
          <NavLink
            to="/home/tables"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-amber-700 text-white' 
                  : 'text-amber-100 hover:bg-amber-700 hover:text-white'
              }`
            }
          >
            <Table2 className="mr-3" size={20} />
            <span>Table Management</span>
          </NavLink>
        </nav>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <button
          onClick={handleLogout}
          className="flex items-center w-full p-3 rounded-lg text-amber-100 hover:bg-amber-700 hover:text-white transition-colors"
        >
          <LogOut className="mr-3" size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminNavbar;
