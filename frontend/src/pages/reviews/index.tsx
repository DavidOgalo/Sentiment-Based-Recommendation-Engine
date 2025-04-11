import { useEffect, useState } from 'react';
import Link from 'next/link';
import { reviewsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Review {
  id: number;
  rating: number;
  comment: string;
  service_name: string;
  service_id: number;
  created_at: string;
}

export default function ReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // Since we don't have a getAll endpoint, we'll fetch reviews for each service
        // This is a temporary solution until we add a proper getAll endpoint
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reviews</h1>
        {user && (
          <Link
            href="/reviews/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Write a Review
          </Link>
        )}
      </div>

      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    <Link href={`/services/${review.service_id}`} className="hover:text-indigo-600">
                      {review.service_name}
                    </Link>
                  </h3>
                  <div className="mt-1 flex items-center">
                    <span className="text-sm text-gray-500">
                      {review.rating} ★
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
              <p className="mt-4 text-sm text-gray-500">{review.comment}</p>
              {user && (
                <div className="mt-4 flex space-x-4">
                  <Link
                    href={`/reviews/${review.id}/edit`}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/reviews/${review.id}/delete`}
                    className="text-sm font-medium text-red-600 hover:text-red-500"
                  >
                    Delete
                  </Link>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 