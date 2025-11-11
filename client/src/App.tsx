import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Home from './pages/Home'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import AdminDashboard from './pages/admin/Dashboard'
import SellerDashboard from './pages/seller/Dashboard'
import ManagerDashboard from './pages/manager/Dashboard'
import Zones from './pages/admin/Zones'
import Spaces from './pages/admin/Spaces'
import Allocations from './pages/admin/Allocations'
import Payments from './pages/admin/Payments'
import Reports from './pages/admin/Reports'
import Notifications from './pages/admin/Notifications'
import SellerRegistration from './pages/admin/SellerRegistration'
import Sellers from './pages/admin/Sellers'
import Users from './pages/admin/Users'
import SellerSpaces from './pages/seller/Spaces'
import SellerPayments from './pages/seller/Payments'
import SellerNotifications from './pages/seller/Notifications'
import Profile from './pages/shared/Profile'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'

function App() {
  const { user, isAuthenticated } = useAuthStore()

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={!isAuthenticated ? <Home /> : <Navigate to="/dashboard" />} />
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
      
      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={
          user?.user_type === 'admin' ? <AdminDashboard /> :
          user?.user_type === 'manager' ? <ManagerDashboard /> :
          <SellerDashboard />
        } />
        <Route path="profile" element={<Profile />} />
        
        {/* Admin routes */}
        {user?.user_type === 'admin' && (
          <>
            <Route path="zones" element={<Zones />} />
            <Route path="spaces" element={<Spaces />} />
            <Route path="sellers" element={<Sellers />} />
            <Route path="users" element={<Users />} />
            <Route path="allocations" element={<Allocations />} />
            <Route path="payments" element={<Payments />} />
            <Route path="reports" element={<Reports />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="seller-registration" element={<SellerRegistration />} />
          </>
        )}
        
        {/* Seller routes */}
        {user?.user_type === 'seller' && (
          <>
            <Route path="my-spaces" element={<SellerSpaces />} />
            <Route path="my-payments" element={<SellerPayments />} />
            <Route path="my-notifications" element={<SellerNotifications />} />
          </>
        )}
        
        {/* Manager routes */}
        {user?.user_type === 'manager' && (
          <>
            <Route path="zones" element={<Zones />} />
            <Route path="spaces" element={<Spaces />} />
            <Route path="allocations" element={<Allocations />} />
            <Route path="payments" element={<Payments />} />
            <Route path="reports" element={<Reports />} />
            <Route path="notifications" element={<Notifications />} />
          </>
        )}
      </Route>
      
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />} />
    </Routes>
  )
}

export default App


