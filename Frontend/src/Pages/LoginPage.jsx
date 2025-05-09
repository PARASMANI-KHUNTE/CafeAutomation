import React, { useState } from 'react';
import { Coffee, Lock, Mail, AlertCircle, Loader } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await authAPI.login(email, password);
      
      // Use the auth context to handle login
      const success = await login({
        token: data.token,
        role: data.role,
        email: email
      });

      if (success) {
        // Get the redirect path from location state or default based on role
        const from = location.state?.from?.pathname || (data.role === 'admin' ? '/home' : '/kitchen');
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col justify-center items-center p-4">
      {/* Logo and Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center mb-2">
          <Coffee className="text-amber-700 mr-2" size={36} />
          <h1 className="text-3xl font-bold text-amber-800">Cozy Corner Café</h1>
        </div>
        <p className="text-gray-600">Management Portal</p>
      </div>
      
      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-amber-600 p-6 text-white text-center">
          <h2 className="text-2xl font-bold">Welcome Back</h2>
          <p className="text-amber-100">Please log in to continue</p>
        </div>
        
        <div className="p-8">
          {error && (
            <div className="mb-6 bg-red-50 text-red-700 p-3 rounded-lg flex items-center">
              <AlertCircle size={20} className="mr-2 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="email" className="block text-gray-700 font-medium mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input 
                  type="email" 
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>
            
            <div className="mb-8">
              <label htmlFor="password" className="block text-gray-700 font-medium mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input 
                  type="password" 
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="mt-2 text-right">
                <Link to="/forgot-password" className="text-sm text-amber-700 hover:text-amber-600 transition-colors">
                  Forgot Password?
                </Link>
              </div>
            </div>
            
            <button 
              type="submit"
              className={`w-full bg-amber-600 text-white py-3 rounded-lg font-medium hover:bg-amber-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${loading ? 'opacity-80 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Loader size={20} className="animate-spin mr-2" />
                  Logging in...
                </span>
              ) : 'Log In'}
            </button>
          </form>
          
          <div className="mt-8 text-center text-gray-600">
            <p>Having trouble logging in? Contact IT support at</p>
            <p className="font-medium text-amber-700">support@cozycornercafe.com</p>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Cozy Corner Café. All rights reserved.</p>
      </div>
    </div>
  );
};

export default LoginPage;