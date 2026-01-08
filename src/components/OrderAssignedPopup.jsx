import { useEffect, useState } from 'react';
import { X, Bike, UtensilsCrossed, DollarSign, User, ArrowRight, CheckCircle } from 'lucide-react';

const OrderAssignedPopup = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Slide in animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto-dismiss after 6 seconds with upward animation
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onClose();
      }, 500); // Wait for slide-out animation
    }, 6000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleViewOrder = () => {
    // Just close the popup - the order will be visible in the orders list
    // The rider can click on it from there
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const orderData = notification.data || notification;
  const orderNumber = orderData.order_number || notification.order_number;
  const restaurantName = orderData.restaurant_name || notification.restaurant_name || 'Restaurant';
  const customerName = orderData.customer_name || notification.customer_name || 'Customer';
  const totalAmount = orderData.total_amount || notification.total_amount;

  return (
    <div
      className={`w-[420px] max-w-[calc(100vw-2rem)] transform transition-all duration-500 ease-in-out ${
        isVisible && !isExiting
          ? 'translate-x-0 opacity-100'
          : isExiting
          ? '-translate-y-full opacity-0'
          : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-white rounded-xl shadow-2xl border-l-4 border-blue-500 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                <Bike className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold truncate">New Order Assigned!</h3>
                <p className="text-sm text-blue-100 truncate">
                  Order #{orderNumber || 'N/A'}
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white hover:text-blue-200 transition-colors flex-shrink-0 ml-2 p-1 rounded-full hover:bg-white hover:bg-opacity-10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 bg-white">
          <div className="space-y-4">
            {/* Restaurant Info */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <UtensilsCrossed className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 font-medium mb-1">Restaurant</p>
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {restaurantName}
                </p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <User className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 font-medium mb-1">Customer</p>
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {customerName}
                </p>
              </div>
            </div>

            {/* Total Amount */}
            {totalAmount && (
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <DollarSign className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-600 font-medium mb-1">Total Amount</p>
                  <p className="text-lg font-bold text-blue-600">
                    ₹{parseFloat(totalAmount).toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleDismiss}
            className="px-4 py-2.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
          >
            Dismiss
          </button>
          <button
            onClick={handleViewOrder}
            className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold transition-colors flex items-center justify-center gap-2 text-sm shadow-md hover:shadow-lg"
          >
            <CheckCircle className="w-4 h-4" />
            View Order
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderAssignedPopup;
