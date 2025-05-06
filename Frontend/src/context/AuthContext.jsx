import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on mount
        const token = localStorage.getItem('authToken');
        const userRole = localStorage.getItem('userRole');
        const userEmail = localStorage.getItem('userEmail');
        const sessionToken = localStorage.getItem('sessionToken');
        
        if (token && userRole && userEmail) {
            setUser({
                token,
                role: userRole,
                email: userEmail,
                sessionToken
            });
        } else if (!sessionToken) {
            // Generate a new session token for non-logged in users
            const newSessionToken = generateSessionToken();
            localStorage.setItem('sessionToken', newSessionToken);
            setUser({ sessionToken: newSessionToken });
        }
        setLoading(false);
    }, []);

    const generateSessionToken = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    const login = async (userData) => {
        try {
            const { token, role, email } = userData;
            
            // Store in localStorage
            localStorage.setItem('authToken', token);
            localStorage.setItem('userRole', role);
            localStorage.setItem('userEmail', email);
            
            // Update state
            setUser({ token, role, email });
            return true;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    };

    const logout = () => {
        // Clear localStorage
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
        
        // Generate new session token for guest user
        const newSessionToken = generateSessionToken();
        localStorage.setItem('sessionToken', newSessionToken);
        
        // Update state
        setUser({ sessionToken: newSessionToken });
    };

    // Check if user is authenticated
    const isAuthenticated = Boolean(user?.token);

    const value = {
        user,
        loading,
        login,
        logout,
        isAuthenticated,
        isAdmin: user?.role === 'admin',
        isStaff: user?.role === 'staff'
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 