import React, { useState, useEffect } from 'react';
import { reviewsApi } from '@/lib/api';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';

interface Review {
  id: number;
  service_id: number;
  service_name: string;
  rating: number;
  comment: string;
  sentiment_score: number;
  created_at: string;
  user: {
    name: string;
  };
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // Get reviews for all services
        const response = await reviewsApi.getByServiceId(0);
        setReviews(response.data as Review[]);
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, []);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Recent Reviews</h1>
        <div className="grid gap-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white shadow rounded-lg p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {review.service_name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    by {review.user.name} on{' '}
                    {new Date(review.created_at).toLocaleDateString()}
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
                        <path
                          fillRule="evenodd"
                          d="M10 15.585l-7.07 3.714 1.35-7.858L.72 7.227l7.88-1.144L10 0l2.4 6.083 7.88 1.144-5.56 5.214 1.35 7.858z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ))}
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      review.sentiment_score >= 0.6
                        ? 'text-green-600'
                        : review.sentiment_score >= 0.3
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}
                  >
                    {review.sentiment_score >= 0.6
                      ? 'Positive'
                      : review.sentiment_score >= 0.3
                      ? 'Neutral'
                      : 'Negative'}
                  </span>
                </div>
              </div>
              <p className="mt-4 text-gray-600">{review.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
} 