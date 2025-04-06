import React, { useState, useEffect } from 'react';
import { reviewsApi } from '@/lib/api';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';

interface Review {
  review_id: number;
  service_id: number;
  user_id: number;
  rating: number;
  comment: string;
  sentiment_score: number;
  created_at: string;
  service: {
    name: string;
    provider: {
      business_name: string;
    };
  };
  user: {
    first_name: string;
    last_name: string;
  };
}

const ReviewsPage = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    service_id: '',
    user_id: '',
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchReviews();
  }, [filters]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.service_id) params.service_id = parseInt(filters.service_id);
      if (filters.user_id) params.user_id = parseInt(filters.user_id);

      const response = await reviewsApi.list(params);
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const getSentimentColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSentimentLabel = (score: number) => {
    if (score >= 0.7) return 'Positive';
    if (score >= 0.4) return 'Neutral';
    return 'Negative';
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reviews</h1>
          {user && (
            <button
              onClick={() => window.location.href = '/reviews/create'}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
            >
              Write a Review
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Service ID</label>
              <input
                type="number"
                name="service_id"
                value={filters.service_id}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">User ID</label>
              <input
                type="number"
                name="user_id"
                value={filters.user_id}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="text-center py-12">Loading reviews...</div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div
                key={review.review_id}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {review.service.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        by {review.service.provider.business_name}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`h-5 w-5 ${
                              i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-gray-700">{review.comment}</p>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500">
                        by {review.user.first_name} {review.user.last_name}
                      </span>
                      <span className="mx-2 text-gray-300">•</span>
                      <span className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSentimentColor(
                          review.sentiment_score
                        )} bg-opacity-10`}
                      >
                        {getSentimentLabel(review.sentiment_score)}
                      </span>
                      <div className="ml-2 flex-1 h-2 bg-gray-200 rounded-full w-24">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${review.sentiment_score * 100}%`,
                            backgroundColor:
                              review.sentiment_score >= 0.7
                                ? '#059669'
                                : review.sentiment_score >= 0.4
                                ? '#D97706'
                                : '#DC2626',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {user && (user.user_id === review.user_id || user.role === 'admin') && (
                    <div className="mt-6 flex space-x-4">
                      <button
                        onClick={() => window.location.href = `/reviews/${review.review_id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => window.location.href = `/reviews/${review.review_id}/delete`}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ReviewsPage; 