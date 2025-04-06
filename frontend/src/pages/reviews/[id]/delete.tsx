import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { reviewsApi } from '@/lib/api';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';

interface Review {
  review_id: number;
  service: {
    name: string;
    provider: {
      business_name: string;
    };
  };
}

const DeleteReviewPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (id) {
      fetchReview();
    }
  }, [id, user]);

  const fetchReview = async () => {
    try {
      const response = await reviewsApi.get(Number(id));
      const reviewData = response.data;
      
      // Check if user is authorized to delete this review
      if (user.user_id !== reviewData.user_id && user.role !== 'admin') {
        router.push('/reviews');
        return;
      }

      setReview(reviewData);
    } catch (error) {
      console.error('Error fetching review:', error);
      setError('Failed to load review. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await reviewsApi.delete(Number(id));
      router.push('/reviews');
    } catch (error) {
      console.error('Error deleting review:', error);
      setError('Failed to delete review. Please try again.');
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    );
  }

  if (!review) {
    return (
      <Layout>
        <div className="text-center py-12">Review not found</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Delete Review</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900">
              {review.service.name}
            </h2>
            <p className="text-sm text-gray-500">
              by {review.service.provider.business_name}
            </p>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Are you sure you want to delete this review? This action cannot be
                  undone.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/reviews')}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="bg-red-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Review'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DeleteReviewPage; 