import React from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FloatingMenuBtn = () => {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate('/menu-management')}
            className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110 flex items-center gap-2 z-50"
        >
            <Plus className="w-6 h-6" />
            <span className="font-medium">Add Menu Item</span>
        </button>
    );
};

export default FloatingMenuBtn; 