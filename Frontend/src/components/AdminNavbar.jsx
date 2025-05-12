import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { BarChart2, Users, Coffee, LogOut, Table2, Tag, FileText, ShoppingBag, Menu, X, ChevronRight, Percent } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminNavbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Close sidebar automatically when navigating on mobile
  useEffect(() => {
    if (windowWidth < 768) {
      setIsOpen(false);
    }
  }, [location.pathname, windowWidth]);

  // Track window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth >= 768) {
        setIsOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initialize on mount
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Hidden button for programmatic sidebar toggling */}
      <button 
        onClick={toggleMenu}
        className="sidebar-toggle hidden"
        aria-hidden="true"
      ></button>
      
      {/* Overlay for mobile */}
      {isOpen && windowWidth < 768 && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-sm"
          onClick={toggleMenu}
          aria-hidden="true"
        ></div>
      )}
      
      {/* Sidebar - adjusted z-index and positioning */}
      <div 
        className={`bg-gradient-to-br from-amber-800 to-amber-900 text-white h-screen fixed left-0 top-0 shadow-xl z-40 transition-all duration-300 ease-in-out ${isOpen ? 'w-72 md:w-64' : 'w-0 md:w-64'} overflow-hidden`}
        aria-hidden={!isOpen}
      >
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center mb-8">
            <Coffee size={28} className="text-amber-300 mr-3" />
            <h1 className="text-2xl font-bold text-amber-50">Café Admin</h1>
            <button 
              onClick={toggleMenu} 
              className="ml-auto text-amber-300 hover:text-white md:hidden"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
          <nav className="space-y-1 flex-1 overflow-y-auto">
          <NavLink
            to="/home/dashboard"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-all ${isActive 
                ? 'bg-amber-700 text-white font-medium shadow-md' 
                : 'text-amber-100 hover:bg-amber-700/50 hover:text-white'}`
            }
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <BarChart2 className="mr-3" size={18} />
                <span>Dashboard</span>
              </div>
              <ChevronRight size={16} className="opacity-50" />
            </div>
          </NavLink>
          
          <NavLink
            to="/home/menu"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-all ${isActive 
                ? 'bg-amber-700 text-white font-medium shadow-md' 
                : 'text-amber-100 hover:bg-amber-700/50 hover:text-white'}`
            }
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <Coffee className="mr-3" size={18} />
                <span>Menu Management</span>
              </div>
              <ChevronRight size={16} className="opacity-50" />
            </div>
          </NavLink>
          
          <NavLink
            to="/home/categories"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-all ${isActive 
                ? 'bg-amber-700 text-white font-medium shadow-md' 
                : 'text-amber-100 hover:bg-amber-700/50 hover:text-white'}`
            }
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <Tag className="mr-3" size={18} />
                <span>Categories</span>
              </div>
              <ChevronRight size={16} className="opacity-50" />
            </div>
          </NavLink>
          
          <NavLink
            to="/home/staff"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-all ${isActive 
                ? 'bg-amber-700 text-white font-medium shadow-md' 
                : 'text-amber-100 hover:bg-amber-700/50 hover:text-white'}`
            }
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <Users className="mr-3" size={18} />
                <span>Staff Management</span>
              </div>
              <ChevronRight size={16} className="opacity-50" />
            </div>
          </NavLink>
          
          <NavLink
            to="/home/orders"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-all ${isActive 
                ? 'bg-amber-700 text-white font-medium shadow-md' 
                : 'text-amber-100 hover:bg-amber-700/50 hover:text-white'}`
            }
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <ShoppingBag className="mr-3" size={18} />
                <span>Current Orders</span>
              </div>
              <ChevronRight size={16} className="opacity-50" />
            </div>
          </NavLink>
          
          <NavLink
            to="/home/order-history"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-all ${isActive 
                ? 'bg-amber-700 text-white font-medium shadow-md' 
                : 'text-amber-100 hover:bg-amber-700/50 hover:text-white'}`
            }
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <FileText className="mr-3" size={18} />
                <span>Order History</span>
              </div>
              <ChevronRight size={16} className="opacity-50" />
            </div>
          </NavLink>
          
          <NavLink
            to="/home/tables"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-all ${isActive 
                ? 'bg-amber-700 text-white font-medium shadow-md' 
                : 'text-amber-100 hover:bg-amber-700/50 hover:text-white'}`
            }
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <Table2 className="mr-3" size={18} />
                <span>Table Management</span>
              </div>
              <ChevronRight size={16} className="opacity-50" />
            </div>
          </NavLink>
          
          <NavLink
            to="/home/discounts"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-all ${isActive 
                ? 'bg-amber-700 text-white font-medium shadow-md' 
                : 'text-amber-100 hover:bg-amber-700/50 hover:text-white'}`
            }
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <Percent className="mr-3" size={18} />
                <span>Discount Management</span>
              </div>
              <ChevronRight size={16} className="opacity-50" />
            </div>
          </NavLink>
          </nav>
          
          <div className="mt-auto pt-4 border-t border-amber-700/50">
            <button
              onClick={handleLogout}
              className="flex items-center justify-between w-full p-3 rounded-lg text-amber-100 hover:bg-amber-700/70 hover:text-white transition-all group"
            >
              <div className="flex items-center">
                <LogOut className="mr-3" size={18} />
                <span>Logout</span>
              </div>
              <span className="bg-amber-700/30 text-xs px-2 py-1 rounded-md group-hover:bg-amber-600 transition-all">ESC</span>
            </button>
            
            <div className="mt-4 text-center text-xs text-amber-200/70">
              <p>Cozy Corner Café</p>
              <p>v1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminNavbar;
