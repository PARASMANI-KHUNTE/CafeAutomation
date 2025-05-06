import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Utensils, Users, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();

    const menuItems = [
        { path: '/home', icon: <Home className="w-6 h-6" />, label: 'Dashboard' },
        { path: '/menu-management', icon: <Utensils className="w-6 h-6" />, label: 'Menu Management' },
        { path: '/users', icon: <Users className="w-6 h-6" />, label: 'Users' },
        { path: '/settings', icon: <Settings className="w-6 h-6" />, label: 'Settings' },
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="w-64 bg-white h-screen shadow-lg">
            {/* Logo */}
            <div className="p-6">
                <h1 className="text-2xl font-bold text-blue-600">Cafe Admin</h1>
            </div>

            {/* Navigation */}
            <nav className="mt-6">
                {menuItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                            location.pathname === item.path ? 'bg-blue-50 text-blue-600' : ''
                        }`}
                    >
                        {item.icon}
                        <span className="font-medium">{item.label}</span>
                    </button>
                ))}
            </nav>

            {/* Logout Button */}
            <div className="absolute bottom-0 w-64 p-6">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors rounded-lg"
                >
                    <LogOut className="w-6 h-6" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar; 