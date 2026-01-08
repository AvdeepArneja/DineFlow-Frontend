import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Package, UtensilsCrossed, Filter, RefreshCw } from 'lucide-react';
import { ordersApi } from '../api/orders';
import { initializeSocket, disconnectSocket } from '../utils/socket';
import toast from 'react-hot-toast';

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchOrders(true);

    // Initialize Socket.io connection for real-time notifications
    const token = localStorage.getItem('token');
    if (token) {
      const socket = initializeSocket(token);

      // Listen for order status update notifications
      const handleOrderStatusUpdate = (data) => {
        console.log('📦 Order status update received via Socket.io:', data);
        
        // Show toast notification
        toast.success(
          data.message || `Order #${data.order_number} status updated to ${data.status}`,
          {
            duration: 5000,
            icon: '📦',
          }
        );

        // Refresh orders list to show updated status
        fetchOrders(false);
      };

      // Register event listener
      socket.on('order_status_update', handleOrderStatusUpdate);

      // Cleanup on unmount
      return () => {
        socket.off('order_status_update', handleOrderStatusUpdate);
        disconnectSocket();
      };
    }

    // Auto-refresh every 10 seconds (fallback)
    intervalRef.current = setInterval(() => {
      fetchOrders(false);
    }, 10000); // Refresh every 10 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [statusFilter]);

  const fetchOrders = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    try {
      const params = {};
      if (statusFilter) {
        params.status = statusFilter;
      }
      const response = await ordersApi.getOrders(params);
      if (response.success) {
        setOrders(response.data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (showLoading) {
        toast.error('Failed to load orders');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    fetchOrders(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-orange-100 text-orange-800',
      ready: 'bg-purple-100 text-purple-800',
      out_for_delivery: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      preparing: 'Preparing',
      ready: 'Ready',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/home')}
                className="flex items-center gap-2 text-gray-700 hover:text-orange-600"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <h1 className="text-xl font-bold text-gray-800 ml-4">My Orders</h1>
            </div>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-orange-600 disabled:opacity-50"
              title="Refresh orders"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Section */}
        <div className="mb-6 flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                !statusFilter
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            {['pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {getStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : orders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-800">#{order.order_number}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <UtensilsCrossed className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-medium text-gray-700">{order.restaurant?.name || 'Restaurant'}</p>
                </div>
                <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                  <Package className="w-3 h-3" />
                  <span>{order.item_count || 0} items</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-sm text-gray-600">Total</span>
                  <span className="font-bold text-gray-800">₹ {parseFloat(order.total_amount || 0).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">No orders found</p>
            <p className="text-gray-500 text-sm mb-4">
              {statusFilter ? `No orders with status "${getStatusLabel(statusFilter)}"` : 'You haven\'t placed any orders yet'}
            </p>
            <button
              onClick={() => navigate('/home')}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
            >
              Browse Restaurants
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
