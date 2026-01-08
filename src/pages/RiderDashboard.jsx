import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bike, 
  Package, 
  Clock, 
  CheckCircle, 
  MapPin,
  Phone,
  LogOut,
  ArrowRight,
  TrendingUp,
  User,
  UtensilsCrossed,
  RefreshCw,
  DollarSign,
  Calendar,
  TrendingDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { riderApi } from '../api/rider';
import { initializeSocket, disconnectSocket } from '../utils/socket';
import OrderAssignedPopup from '../components/OrderAssignedPopup';
import toast from 'react-hot-toast';

const RiderDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [orderAssignedNotifications, setOrderAssignedNotifications] = useState([]); // Queue of notifications to show
  const shownNotificationIdsRef = useRef(new Set()); // Use ref for immediate synchronous access

  useEffect(() => {
    fetchOrders();
    fetchStats();
    
    // Initialize Socket.io connection for real-time notifications
    const token = localStorage.getItem('token');
    if (token) {
      const socket = initializeSocket(token);

      // Listen for order assignment notifications
      const handleOrderAssigned = (data) => {
        console.log('📦 New order assignment received via Socket.io:', data);
        
        // Create notification object for popup
        const notification = {
          _id: `socket_${Date.now()}_${data.order_id || data.order_number}`, // Temporary ID for socket notifications
          type: 'order_assigned',
          title: 'New Order Assigned',
          message: data.message || `You have been assigned order #${data.order_number || 'N/A'}`,
          data: {
            order_id: data.order_id,
            order_number: data.order_number,
            restaurant_id: data.restaurant_id,
            restaurant_name: data.restaurant_name,
            customer_name: data.customer_name,
            total_amount: data.total_amount,
          },
          order_id: data.order_id,
          order_number: data.order_number,
          restaurant_name: data.restaurant_name,
          customer_name: data.customer_name,
          total_amount: data.total_amount,
          read: false,
          createdAt: new Date().toISOString(),
        };

        // Add to notification queue if not already shown
        if (!shownNotificationIdsRef.current.has(notification._id)) {
          setOrderAssignedNotifications(prev => {
            const existingIds = new Set(prev.map(n => n._id));
            if (!existingIds.has(notification._id)) {
              shownNotificationIdsRef.current.add(notification._id);
              return [...prev, notification];
            }
            return prev;
          });
        }

        // Refresh orders list to show the new assignment
        fetchOrders(false);
        fetchStats();
      };

      // Register event listener
      socket.on('order_assigned', handleOrderAssigned);

      // Cleanup on unmount
      return () => {
        socket.off('order_assigned', handleOrderAssigned);
        disconnectSocket();
      };
    }
    
    // Auto-refresh orders every 10 seconds (fallback)
    const interval = setInterval(() => {
      fetchOrders(false);
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const fetchOrders = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }
    try {
      const response = await riderApi.getMyOrders();
      if (response.success) {
        const ordersList = response.data.orders || [];
        // Sort: Active orders (ready, out_for_delivery) first, then delivered, all sorted by newest first
        const sortedOrders = [...ordersList].sort((a, b) => {
          // Priority: active orders (ready, out_for_delivery) > delivered > others
          const getPriority = (status) => {
            if (status === 'ready' || status === 'out_for_delivery') return 0;
            if (status === 'delivered') return 1;
            return 2;
          };
          
          const priorityA = getPriority(a.status);
          const priorityB = getPriority(b.status);
          
          // If different priorities, sort by priority (active first)
          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }
          
          // Same priority, sort by creation date (newest first)
          const dateA = new Date(a.created_at || a.createdAt || 0);
          const dateB = new Date(b.created_at || b.createdAt || 0);
          if (dateB.getTime() !== dateA.getTime()) {
            return dateB.getTime() - dateA.getTime();
          }
          
          // Same date, sort by ID (newest first)
          return (b.id || 0) - (a.id || 0);
        });
        setOrders(sortedOrders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (showLoading) {
        toast.error('Failed to load orders');
      }
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  const fetchStats = async () => {
    try {
      const response = await riderApi.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setIsUpdating(true);
    try {
      const response = await riderApi.updateOrderStatus(orderId, newStatus);
      if (response.success) {
        toast.success(`Order status updated to ${getStatusLabel(newStatus)}`);
        fetchOrders(); // Refresh orders
        fetchStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      const message = error.response?.data?.message || 'Failed to update order status';
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      ready: 'bg-purple-100 text-purple-800 border-purple-200',
      out_for_delivery: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusLabel = (status) => {
    const labels = {
      ready: 'Ready',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  const getNextStatus = (currentStatus) => {
    const transitions = {
      ready: 'out_for_delivery', // "Mark as Picked" changes ready → out_for_delivery
      out_for_delivery: 'delivered', // "Mark as Delivered" changes out_for_delivery → delivered
    };
    return transitions[currentStatus];
  };

  const getActionLabel = (currentStatus) => {
    const labels = {
      ready: 'Mark as Picked',
      out_for_delivery: 'Mark as Delivered',
    };
    return labels[currentStatus] || 'Update Status';
  };

  const canUpdateStatus = (status) => {
    // Riders can only update orders that are "ready" (to mark as picked) or "out_for_delivery" (to mark as delivered)
    return ['ready', 'out_for_delivery'].includes(status);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Bike className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 flex-shrink-0" />
              <h1 className="text-base sm:text-xl font-bold text-gray-800 truncate">Rider Dashboard</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-semibold text-xs sm:text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'R'}
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700 hidden sm:inline">{user?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 sm:gap-2 text-gray-700 hover:text-red-600 p-1 sm:p-0"
                title="Logout"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden md:inline text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Statistics Cards */}
        {stats && (
          <>
            {/* Order Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">Total Orders</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-800">{stats.stats.total_orders}</p>
                  </div>
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                    <Package className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">Delivered</p>
                    <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.stats.delivered_orders}</p>
                  </div>
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                    <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">Active Orders</p>
                    <p className="text-lg sm:text-2xl font-bold text-orange-600">{stats.stats.active_orders}</p>
                  </div>
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                    <Clock className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">Completion Rate</p>
                    <p className="text-lg sm:text-2xl font-bold text-indigo-600">{stats.stats.completion_rate}%</p>
                  </div>
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                    <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-indigo-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Earnings Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-sm p-3 sm:p-6 border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">Total Earnings</p>
                    <p className="text-lg sm:text-2xl font-bold text-green-700">₹ {parseFloat(stats.stats.total_earnings || 0).toFixed(2)}</p>
                  </div>
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                    <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-green-700" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg shadow-sm p-3 sm:p-6 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">Today's Earnings</p>
                    <p className="text-lg sm:text-2xl font-bold text-blue-700">₹ {parseFloat(stats.stats.today_earnings || 0).toFixed(2)}</p>
                  </div>
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                    <Calendar className="w-4 h-4 sm:w-6 sm:h-6 text-blue-700" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow-sm p-3 sm:p-6 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">This Month</p>
                    <p className="text-lg sm:text-2xl font-bold text-purple-700">₹ {parseFloat(stats.stats.this_month_earnings || 0).toFixed(2)}</p>
                  </div>
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-purple-200 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                    <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-purple-700" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg shadow-sm p-3 sm:p-6 border border-amber-200">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">Avg per Delivery</p>
                    <p className="text-lg sm:text-2xl font-bold text-amber-700">₹ {parseFloat(stats.stats.average_earning_per_delivery || 0).toFixed(2)}</p>
                  </div>
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-amber-200 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                    <TrendingDown className="w-4 h-4 sm:w-6 sm:h-6 text-amber-700" />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Orders Section */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">My Orders</h2>
              <button
                onClick={() => fetchOrders()}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 hover:text-gray-900 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

          </div>

          {/* Orders List */}
          <div className="divide-y divide-gray-200">
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No Orders Found</h3>
                <p className="text-gray-600">
                  You don't have any assigned orders yet. Orders will be automatically assigned when restaurants mark them as ready.
                </p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                        <span className="text-sm font-semibold text-gray-800">#{order.order_number}</span>
                        <span className="text-xs sm:text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                        {/* Restaurant Info */}
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-500 mb-1">Restaurant</p>
                            <p className="font-semibold text-sm sm:text-base text-gray-800 truncate">{order.restaurant.name}</p>
                            {order.restaurant.phone && (
                              <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3" />
                                <span className="truncate">{order.restaurant.phone}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Customer Info */}
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-500 mb-1">Customer</p>
                            <p className="font-semibold text-sm sm:text-base text-gray-800 truncate">{order.customer.name}</p>
                            {order.customer.phone && (
                              <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3" />
                                <span className="truncate">{order.customer.phone}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Delivery Address */}
                      <div className="flex items-start gap-2 sm:gap-3 mb-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-500 mb-1">Delivery Address</p>
                          <p className="text-xs sm:text-sm text-gray-800 break-words">
                            {order.delivery_address.address_line}, {order.delivery_address.city}
                            {order.delivery_address.state && `, ${order.delivery_address.state}`}
                            {order.delivery_address.zip_code && ` ${order.delivery_address.zip_code}`}
                          </p>
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {order.item_count} item{order.item_count !== 1 ? 's' : ''} • ₹{parseFloat(order.total_amount).toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={() => navigate(`/orders/${order.id}`)}
                          className="flex items-center gap-2 text-xs sm:text-sm text-orange-600 hover:text-orange-700 font-medium self-start sm:self-auto"
                        >
                          View Details
                          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="w-full sm:w-auto sm:ml-4 sm:flex-shrink-0">
                      {canUpdateStatus(order.status) ? (
                        <button
                          onClick={() => handleUpdateStatus(order.id, getNextStatus(order.status))}
                          disabled={isUpdating}
                          className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                          {isUpdating ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Updating...
                            </div>
                          ) : (
                            getActionLabel(order.status)
                          )}
                        </button>
                      ) : (
                        <div className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 bg-gray-100 text-gray-500 rounded-lg font-medium text-sm sm:text-base text-center">
                          {getStatusLabel(order.status)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Order Assigned Popups - Stacked from top */}
      {orderAssignedNotifications.map((notification, index) => (
        <div
          key={notification._id}
          style={{
            top: `${1 + index * 28}rem`, // Stack notifications with 28rem spacing (starting from 1rem)
          }}
          className="fixed right-2 sm:right-4 z-50"
        >
          <OrderAssignedPopup
            notification={notification}
            onClose={() => {
              // Remove from queue and ensure it's marked as shown in ref
              setOrderAssignedNotifications(prev => prev.filter(n => n._id !== notification._id));
              shownNotificationIdsRef.current.add(notification._id);
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default RiderDashboard;
