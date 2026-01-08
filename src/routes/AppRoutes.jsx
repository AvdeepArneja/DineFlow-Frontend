import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Auth Pages
import Login from '../pages/Login';
import Signup from '../pages/Signup';

// Dashboard Pages (create placeholders for now)
import CustomerHome from '../pages/Dashboard/CustomerHome';
import RestaurantDashboard from '../pages/Dashboard/RestaurantDashboard';
import RiderDashboard from '../pages/Dashboard/RiderDashboard';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Customer Routes */}
      <Route
        path="/customer/*"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerHome />
          </ProtectedRoute>
        }
      />

      {/* Restaurant Routes */}
      <Route
        path="/restaurant/*"
        element={
          <ProtectedRoute allowedRoles={['restaurant_owner']}>
            <RestaurantDashboard />
          </ProtectedRoute>
        }
      />

      {/* Rider Routes */}
      <Route
        path="/rider/*"
        element={
          <ProtectedRoute allowedRoles={['rider']}>
            <RiderDashboard />
          </ProtectedRoute>
        }
      />

      {/* Default Redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
