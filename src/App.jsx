import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import RestaurantDetail from "./pages/RestaurantDetail";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Profile from "./pages/Profile";
import SearchResults from "./pages/SearchResults";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import CreateRestaurant from "./pages/CreateRestaurant";
import EditRestaurant from "./pages/EditRestaurant";
import MenuManagement from "./pages/MenuManagement";
import RiderDashboard from "./pages/RiderDashboard";
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Default route - redirect to signup */}
          <Route path="/" element={<Navigate to="/signup" replace />} />
          
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected Routes */}
          <Route 
            path="/home" 
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Home />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/restaurant/:id" 
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <RestaurantDetail />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/checkout" 
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Checkout />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/orders" 
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Orders />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/orders/:id" 
            element={
              <ProtectedRoute allowedRoles={['customer', 'restaurant_owner', 'rider']}>
                <OrderDetail />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Profile />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/search" 
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <SearchResults />
              </ProtectedRoute>
            } 
          />
          
          {/* Restaurant Owner Routes */}
          <Route 
            path="/restaurant/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['restaurant_owner']}>
                <RestaurantDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/restaurant/create" 
            element={
              <ProtectedRoute allowedRoles={['restaurant_owner']}>
                <CreateRestaurant />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/restaurant/:id/edit" 
            element={
              <ProtectedRoute allowedRoles={['restaurant_owner']}>
                <EditRestaurant />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/restaurant/:id/menu" 
            element={
              <ProtectedRoute allowedRoles={['restaurant_owner']}>
                <MenuManagement />
              </ProtectedRoute>
            } 
          />
          
          {/* Rider Routes */}
          <Route 
            path="/rider/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['rider']}>
                <RiderDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch all - redirect to signup */}
          <Route path="*" element={<Navigate to="/signup" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
