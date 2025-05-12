import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './Pages/LoginPage'
import ForgotPassword from './Pages/ForgotPassword'
import HomePage from './Pages/HomePage'
import MenuManagementPage from './Pages/MenuManagementPage'
import CategoryManagementPage from './Pages/CategoryManagementPage'
import OrderHistoryPage from './Pages/OrderHistoryPage'
import LandingPage from './Pages/LandingPage'
import { AuthProvider, useAuth } from './context/AuthContext'
import StaffContent from './Pages/StaffContent'
import { OrderProvider } from './context/OrderContext'
import { SocketProvider } from './context/SocketContext'
import KitchenPanel from './Pages/KitchenPanel'
import CustomerOrders from './Pages/CustomerOrders'
import TablePage from './Pages/TablePage'
import DashboardPage from './Pages/DashboardPage'
import AdminOrders from './Pages/AdminOrders'
import TableManagement from './Pages/TableManagement'
import DiscountManagement from './Pages/DiscountManagement'

const ProtectedRoute = ({ children, isAuthenticated, userRole, requiredRole }) => {
  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" replace />
  }
  return children
}

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth()

  return (
    <Routes>
      {/* Landing page route */}
      <Route path="/" element={<LandingPage />} />

      {/* Login route with role-based redirect if already authenticated */}
      <Route
        path="/login"
        element={
          isAuthenticated
            ? user?.role === 'staff'
              ? <Navigate to="/kitchen" replace />
              : <Navigate to="/home" replace />
            : <LoginPage />
        }
      />

      {/* Forgot Password route */}
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected admin routes */}
      <Route
        path="/home"
        element={
          <ProtectedRoute
            isAuthenticated={isAuthenticated}
            userRole={user?.role}
            requiredRole="admin"
          >
            <HomePage />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="menu" element={<MenuManagementPage />} />
        <Route path="categories" element={<CategoryManagementPage />} />
        <Route path="staff" element={<StaffContent />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="order-history" element={<OrderHistoryPage />} />
        <Route path="tables" element={<TableManagement />} />
        <Route path="discounts" element={<DiscountManagement />} />
      </Route>

      {/* Protected kitchen route */}
      <Route
        path="/kitchen"
        element={
          <ProtectedRoute
            isAuthenticated={isAuthenticated}
            userRole={user?.role}
            requiredRole="staff"
          >
            <KitchenPanel />
          </ProtectedRoute>
        }
      />

      {/* Customer orders route - not protected */}
      <Route path="/orders" element={<CustomerOrders />} />

      {/* Table route for QR code scanning */}
      <Route path="/table/:tableNumber" element={<TablePage />} />

      {/* Default route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <OrderProvider>
            <AppRoutes />
          </OrderProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  )
}

export default App