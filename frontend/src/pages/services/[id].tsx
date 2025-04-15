import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { servicesApi, reviewsApi, Review, Service, usersApi } from '@/lib/api';
import { Spinner } from '@/components/common/Spinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { useAuth } from '@/contexts/AuthContext';
import { FaStar } from 'react-icons/fa';

interface ReviewFormData {
  rating: number;
  comment: string;
}

interface ReviewWithUser extends Review {
  user_first_name: string;
}

export default function ServiceDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [service, setService] = useState<Service | null>(null);
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState<ReviewFormData>({
    rating: 5,
    comment: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        const serviceData = await servicesApi.getById(Number(id));
        setService(serviceData);
        
        const reviewsData = await reviewsApi.getServiceReviews(Number(id));
        setReviews(reviewsData);
      } catch (err) {
        console.error('Error fetching service details:', err);
        setError('Failed to load service details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchServiceDetails();
  }, [id]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service || !user) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      
      const newReview = await reviewsApi.createReview({
        service_id: service.service_id,
        rating: reviewForm.rating,
        comment: reviewForm.comment
      });

      // Add the new review with the current user's first name
      const reviewWithUser = {
        ...newReview,
        user_first_name: user.first_name || 'Anonymous'
      };

      setReviews([reviewWithUser, ...reviews]);
      setReviewForm({ rating: 5, comment: '' });
    } catch (err) {
      console.error('Error submitting review:', err);
      setSubmitError('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ErrorMessage 
          message={error || 'Service not found'} 
          onRetry={() => router.reload()} 
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h1 className="text-3xl font-bold text-gray-900">{service.name}</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {service.description}
          </p>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Category</dt>
              <dd className="mt-1 text-sm text-gray-900">{service.category_name}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Provider</dt>
              <dd className="mt-1 text-sm text-gray-900">{service.provider_name}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Price Range</dt>
              <dd className="mt-1 text-sm text-gray-900">
                ${service.price_range.min} - ${service.price_range.max}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Average Rating</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {service.average_rating.toFixed(1)} ★ ({reviews.length} reviews)
              </dd>
            </div>
          </dl>
        </div>

        {/* Reviews Section */}
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Reviews</h2>
          
          {user && (
            <form onSubmit={handleReviewSubmit} className="mb-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rating</label>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, rating })}
                        className="focus:outline-none"
                      >
                        <FaStar
                          className={`h-6 w-6 ${
                            rating <= reviewForm.rating
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
                    Comment
                  </label>
                  <textarea
                    id="comment"
                    rows={3}
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                
                {submitError && (
                  <p className="text-sm text-red-600">{submitError}</p>
                )}
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          )}

          <div className="space-y-6">
            {reviews.length === 0 ? (
              <p className="text-gray-500">No reviews yet. Be the first to review!</p>
            ) : (
              reviews.map((review) => (
                <div key={review.review_id} className="border-b border-gray-200 pb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <FaStar
                            key={rating}
                            className={`h-5 w-5 ${
                              rating <= review.rating
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">
                        by {review.user_first_name}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-700">{review.comment}</p>
                  {review.sentiment_score !== null && (
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">
                        Sentiment Score: {review.sentiment_score.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 