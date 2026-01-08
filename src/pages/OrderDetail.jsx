import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Phone, UtensilsCrossed, Package, CheckCircle, XCircle, RefreshCw, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ordersApi } from '../api/orders';
import { reviewsApi } from '../api/reviews';
import ReviewForm from '../components/ReviewForm';
import toast from 'react-hot-toast';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [myReview, setMyReview] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  useEffect(() => {
    // Fetch user's review if order is delivered
    const restaurantId = order?.restaurant?.id || order?.restaurant_id;
    if (order && order.status === 'delivered' && restaurantId) {
      fetchMyReview(restaurantId);
    }
  }, [order?.status, order?.restaurant?.id, order?.restaurant_id]);

  const fetchMyReview = async (restaurantId) => {
    if (!restaurantId) return;
    try {
      const response = await reviewsApi.getMyReviewForRestaurant(restaurantId);
      if (response.success) {
        setMyReview(response.data.review);
      }
    } catch (error) {
      console.error('Error fetching review:', error);
    }
  };

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    fetchMyReview();
  };

  // Auto-refresh polling effect - only for active orders
  useEffect(() => {
    // Only poll if order exists and is active (not delivered/cancelled)
    if (!order || ['delivered', 'cancelled'].includes(order.status)) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Set up polling every 5 seconds
    intervalRef.current = setInterval(() => {
      fetchOrderDetails(false); // Don't show loading spinner on auto-refresh
    }, 5000); // Refresh every 5 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [order?.status, order?.id]); // Re-run when order status changes

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

  const fetchOrderDetails = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    try {
      const response = await ordersApi.getOrderById(id);
      if (response.success) {
        const previousStatus = order?.status;
        setOrder(response.data.order);
        
        // Show toast notification if status changed
        if (previousStatus && previousStatus !== response.data.order.status && !showLoading) {
          toast.success(`Order status updated to ${getStatusLabel(response.data.order.status)}`, {
            duration: 2000,
          });
        }
      } else {
        if (showLoading) {
          toast.error('Failed to load order details');
          navigate('/orders');
        }
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      if (showLoading) {
        toast.error('Failed to load order details');
        navigate('/orders');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    fetchOrderDetails(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      preparing: 'bg-orange-100 text-orange-800 border-orange-200',
      ready: 'bg-purple-100 text-purple-800 border-purple-200',
      out_for_delivery: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status) => {
    if (status === 'delivered') {
      return <CheckCircle className="w-5 h-5" />;
    }
    if (status === 'cancelled') {
      return <XCircle className="w-5 h-5" />;
    }
    return <Clock className="w-5 h-5" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">Order not found</p>
          <button
            onClick={() => navigate('/orders')}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/orders')}
                className="flex items-center gap-2 text-gray-700 hover:text-orange-600"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <h1 className="text-xl font-bold text-gray-800 ml-4">Order Details</h1>
            </div>
            {order && !['delivered', 'cancelled'].includes(order.status) && (
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-orange-600 disabled:opacity-50"
                title="Refresh order status"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Order Status Card */}
        <div className={`bg-white rounded-lg shadow-sm p-6 mb-6 border-2 ${getStatusColor(order.status)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(order.status)}
              <div>
                <p className="text-sm text-gray-600">Order Status</p>
                <p className="text-xl font-bold">{getStatusLabel(order.status)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Order Number</p>
              <p className="text-lg font-semibold">#{order.order_number}</p>
            </div>
          </div>
        </div>

        {/* Restaurant Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Restaurant</h2>
          <div className="flex items-center gap-3">
            <UtensilsCrossed className="w-5 h-5 text-orange-500" />
            <div>
              <p className="font-semibold text-gray-800">{order.restaurant?.name || 'Restaurant'}</p>
              {order.restaurant?.phone && (
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-600">{order.restaurant.phone}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Order Items</h2>
          <div className="space-y-4">
            {order.items && order.items.length > 0 ? (
              order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {item.menu_item?.name || item.item_name || 'Item'}
                    </p>
                    <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">₹ {parseFloat(item.price || 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      ₹ {parseFloat(item.subtotal || (item.price * item.quantity) || 0).toFixed(2)} total
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No items found</p>
            )}
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Delivery Address</h2>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-orange-500 mt-1" />
            <div>
              <p className="text-gray-800">{order.delivery_address?.address_line || 'Address'}</p>
              <p className="text-sm text-gray-600 mt-1">
                {order.delivery_address?.city && `${order.delivery_address.city}, `}
                {order.delivery_address?.state && `${order.delivery_address.state} `}
                {order.delivery_address?.zip_code && order.delivery_address.zip_code}
              </p>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Order Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₹ {parseFloat(order.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery Fee</span>
              <span>₹ {parseFloat(order.delivery_fee || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-800 pt-3 border-t">
              <span>Total</span>
              <span>₹ {parseFloat(order.total_amount || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Status */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Payment Status</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                order.payment_status === 'paid'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
              </span>
            </div>
          </div>

          {/* Order Dates */}
          <div className="mt-4 pt-4 border-t space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Order Placed</span>
              <span>{new Date(order.created_at).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}</span>
            </div>
            {order.delivered_at && (
              <div className="flex justify-between">
                <span>Delivered</span>
                <span>{new Date(order.delivered_at).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}</span>
              </div>
            )}
            {order.cancelled_at && (
              <div className="flex justify-between">
                <span>Cancelled</span>
                <span>{new Date(order.cancelled_at).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}</span>
              </div>
            )}
            {order.cancellation_reason && (
              <div className="mt-2 pt-2 border-t">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Cancellation Reason:</span> {order.cancellation_reason}
                </p>
              </div>
            )}
          </div>

          {/* Review Section - Only for delivered orders */}
          {order.status === 'delivered' && (order.restaurant?.id || order.restaurant_id) && (
            <div className="mt-6 pt-6 border-t">
              {showReviewForm ? (
                <ReviewForm
                  restaurantId={order.restaurant?.id || order.restaurant_id}
                  orderId={order.id}
                  existingReview={myReview}
                  onSuccess={handleReviewSuccess}
                  onCancel={() => setShowReviewForm(false)}
                />
              ) : myReview ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800">Your Review</h3>
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-white font-medium transition-colors"
                    >
                      Edit Review
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= myReview.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  {myReview.review_text && (
                    <p className="text-gray-700 text-sm">{myReview.review_text}</p>
                  )}
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">How was your experience?</h3>
                      <p className="text-sm text-gray-600">Share your feedback about this restaurant</p>
                    </div>
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition-colors flex items-center gap-2"
                    >
                      <Star className="w-4 h-4" />
                      Write Review
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex gap-4">
            {user?.role === 'customer' ? (
              <>
                <button
                  onClick={() => navigate('/orders')}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Back to Orders
                </button>
                <button
                  onClick={() => navigate('/home')}
                  className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
                >
                  Order Again
                </button>
              </>
            ) : user?.role === 'restaurant_owner' ? (
              <button
                onClick={() => navigate('/restaurant/dashboard')}
                className="w-full px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
              >
                Back to Dashboard
              </button>
            ) : (
              <button
                onClick={() => navigate('/orders')}
                className="w-full px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
              >
                Back
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
