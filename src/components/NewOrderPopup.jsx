import { useEffect, useState } from 'react';
import { X, Package, User, DollarSign, CheckCircle, UtensilsCrossed, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../api/notifications';

const NewOrderPopup = ({ notification, onClose, onAccept }) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Slide in animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto-dismiss after 5 seconds with upward animation
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onClose();
      }, 500); // Wait for slide-out animation
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleViewOrder = () => {
    if (notification.data?.order_id) {
      navigate(`/orders/${notification.data.order_id}`);
    }
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const handleAccept = async () => {
    if (notification._id) {
      try {
        await notificationsApi.markAsRead(notification._id);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    if (onAccept) {
      onAccept();
    }
    handleViewOrder();
  };

  const handleDismiss = () => {
    // Don't mark as read when dismissing - let user see it in notifications tab
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 500);
  };

  return (
    <div
      className={`w-96 max-w-[calc(100vw-2rem)] transform transition-all duration-500 ease-in-out ${
        isVisible && !isExiting
          ? 'translate-x-0 opacity-100'
          : isExiting
          ? '-translate-y-full opacity-0'
          : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-white rounded-lg shadow-2xl border-l-4 border-orange-500 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold truncate">New Order!</h3>
                <p className="text-xs text-orange-100 truncate">
                  Order #{notification.data?.order_number || 'N/A'}
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white hover:text-gray-200 transition-colors flex-shrink-0 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 bg-white">
          <div className="space-y-3">
            {/* Customer Info */}
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-500">Customer</p>
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {notification.data?.customer_name || 'Customer'}
                </p>
              </div>
            </div>

            {/* Total Amount */}
            {notification.data?.total_amount && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-sm font-bold text-orange-600">
                    ₹{parseFloat(notification.data.total_amount).toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex gap-2">
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-medium transition-colors"
          >
            Dismiss
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 px-3 py-1.5 bg-orange-500 text-white rounded hover:bg-orange-600 font-medium transition-colors flex items-center justify-center gap-1.5 text-xs"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            View Order
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewOrderPopup;
