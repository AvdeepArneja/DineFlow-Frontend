import { useState, useEffect } from 'react';
import { Star, X } from 'lucide-react';
import { reviewsApi } from '../api/reviews';
import toast from 'react-hot-toast';

const ReviewForm = ({ restaurantId, orderId, existingReview, onSuccess, onCancel }) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState(existingReview?.review_text || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (reviewText.trim().length > 0 && reviewText.trim().length < 10) {
      toast.error('Review text must be at least 10 characters');
      return;
    }

    if (reviewText.length > 1000) {
      toast.error('Review text must be at most 1000 characters');
      return;
    }

    // Use existing review's order_id if updating, otherwise use provided orderId
    const finalOrderId = existingReview?.order_id || orderId;
    
    if (!restaurantId || !finalOrderId) {
      toast.error('Missing required information. Please try again.');
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewsApi.createOrUpdateReview({
        restaurant_id: restaurantId,
        order_id: finalOrderId,
        rating: rating,
        review_text: reviewText.trim() || null,
      });
      toast.success(existingReview ? 'Review updated successfully!' : 'Review submitted successfully!');
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit review';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">
          {existingReview ? 'Update Your Review' : 'Write a Review'}
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Rating Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoveredRating || rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm text-gray-600">
                {rating} {rating === 1 ? 'star' : 'stars'}
              </span>
            )}
          </div>
        </div>

        {/* Review Text */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Review (Optional)
          </label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your experience with this restaurant..."
            rows={4}
            maxLength={1000}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-500">
              {reviewText.length > 0 && reviewText.length < 10 && (
                <span className="text-orange-600">
                  Minimum 10 characters required
                </span>
              )}
            </p>
            <p className="text-xs text-gray-500">
              {reviewText.length}/1000 characters
            </p>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              isSubmitting || rating === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {isSubmitting ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;
