import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { reviewsApi } from '@/lib/api';
import { Review } from '@/lib/api';
import { Spinner } from '@/components/common/Spinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { CreateReviewForm } from '@/components/reviews/CreateReviewForm';

export default function ReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await reviewsApi.getUserReviews();
        setReviews(response);
      } catch (err: any) {
        setError(err.message || 'Failed to load reviews');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchReviews();
    }
  }, [user]);

  const handleCreateReview = async (data: { service_id: number; rating: number; comment: string }) => {
    try {
      const newReview = await reviewsApi.create(data);
      setReviews(prev => [newReview, ...prev]);
      setShowCreateForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create review');
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    try {
      await reviewsApi.delete(reviewId);
      setReviews(prev => prev.filter(review => review.review_id !== reviewId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete review');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to view reviews</h2>
          <p className="text-gray-600">Sign in to view and manage your reviews.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Reviews</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Write a Review
        </button>
      </div>

      {showCreateForm && (
        <div className="mb-8">
          <CreateReviewForm
            onSubmit={handleCreateReview}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">You haven't written any reviews yet.</p>
          </div>
        ) : (
          reviews.map((review) => (
            <ReviewCard
              key={review.review_id}
              review={review}
              onDelete={handleDeleteReview}
            />
          ))
        )}
      </div>
    </div>
  );
} 