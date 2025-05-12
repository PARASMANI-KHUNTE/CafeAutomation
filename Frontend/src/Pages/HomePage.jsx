import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import AdminNavbar from '../components/AdminNavbar';

const HomePage = () => {
  const location = useLocation();
  const [pageTitle, setPageTitle] = useState('Dashboard');
  
  // Update page title based on current route
  useEffect(() => {
    const path = location.pathname.split('/');
    const currentPage = path[path.length - 1];
    
    // Map route to readable title
    const titleMap = {
      'dashboard': 'Dashboard',
      'menu': 'Menu Management',
      'categories': 'Categories',
      'staff': 'Staff Management',
      'orders': 'Current Orders',
      'order-history': 'Order History',
      'tables': 'Table Management'
    };
    
    setPageTitle(titleMap[currentPage] || 'Dashboard');
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminNavbar />
      
      {/* Main Content - improved spacing for mobile */}
      <div className="flex-1 md:ml-64 overflow-auto transition-all duration-300 ease-in-out">
        {/* Page Header - adjusted for mobile with proper spacing */}
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
          <div className="px-4 sm:px-6 lg:px-8 py-3 md:py-4 flex items-center justify-between">
            {/* Menu button added to open sidebar on mobile */}
            <div className="md:hidden">
              <button 
                onClick={() => document.querySelector('.sidebar-toggle').click()}
                className="bg-amber-700 text-white p-1.5 rounded-md hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                aria-label="Open menu"
              >
                <Menu size={18} />
              </button>
            </div>
            <div className="flex-1 flex justify-center md:justify-start">
              <h1 className="text-xl md:text-2xl font-semibold text-gray-800 md:ml-0">{pageTitle}</h1>
            </div>
            <div className="flex items-center space-x-3">
              <span className="hidden md:inline-block text-sm text-gray-500">{new Date().toLocaleDateString()}</span>
              <div className="h-8 w-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-medium">
                A
              </div>
            </div>
          </div>
        </header>
        
        {/* Page Content - improved responsive padding */}
        <main className="p-4 pt-6 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="mt-4 md:mt-0"> {/* Added spacing for mobile view */}
            <Outlet />
          </div>
        </main>
        
        {/* Footer */}
        <footer className="mt-auto py-4 px-6 text-center text-sm text-gray-500 border-t border-gray-200">
          <p>© {new Date().getFullYear()} Cozy Corner Café. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default HomePage;