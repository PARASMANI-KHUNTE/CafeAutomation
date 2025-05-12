import React from 'react';
import { Outlet } from 'react-router-dom';
import FloatingMenuBtn from './FloatingMenuBtn';

const AdminLayout = ({ showFloatingBtn = true, children }) => {
    return (
        <div className="min-h-screen bg-gray-100">
            {/* Main Content */}
            <div className="h-full">
                {children || <Outlet />}
            </div>

            {/* Floating Menu Button - Only show if showFloatingBtn is true */}
            {showFloatingBtn && <FloatingMenuBtn />}
        </div>
    );
};

export default AdminLayout;