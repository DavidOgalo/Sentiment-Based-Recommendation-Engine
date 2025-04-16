import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { servicesApi, reviewsApi, Review, Service, usersApi } from '@/lib/api';
import { Spinner } from '@/components/common/Spinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { useAuth } from '@/contexts/AuthContext';
import { FaStar } from 'react-icons/fa';
import Link from 'next/link';
import { Button } from '@/components/common/Button';

interface ReviewFormData {
  rating: number;
  comment: string;
}

interface ReviewWithUser extends Review {
  user_first_name: string;
}

const ServiceDetailsPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user, redirectToLogin } = useAuth();
  const [service, setService] = useState<Service | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch service details first
        const serviceData = await servicesApi.getById(Number(id));
        setService(serviceData);
        
        // Then fetch reviews
        try {
          const reviewsData = await reviewsApi.getServiceReviews(Number(id));
          setReviews(reviewsData);
        } catch (reviewError) {
          console.error('Error fetching reviews:', reviewError);
          // Don't set error state for review fetch failure
          setReviews([]);
        }
      } catch (err) {
        console.error('Error fetching service details:', err);
        setError('Failed to load service details. Please try again.');
        setService(null);
        setReviews([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServiceDetails();
  }, [id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      redirectToLogin();
      return;
    }

    try {
      setIsSubmitting(true);
      const newReview = await reviewsApi.createReview({
        service_id: Number(id),
        rating,
        comment
      });
      setReviews(prev => [newReview, ...prev]);
      setComment('');
      setRating(0);
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <ErrorMessage 
          message={error} 
          onRetry={() => window.location.reload()} 
        />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <ErrorMessage 
          message="Service not found" 
          onRetry={() => router.push('/services')} 
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-3xl font-bold mb-4">{service.name}</h1>
        <p className="text-gray-600 mb-4">{service.description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Category</p>
            <p className="font-medium">{service.category_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Provider</p>
            <p className="font-medium">{service.provider_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Price Range</p>
            <p className="font-medium">${service.price_range.min} - ${service.price_range.max}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Average Rating</p>
            <p className="font-medium">{service.average_rating.toFixed(1)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Reviews</h2>
        
        {!user ? (
          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <p className="text-gray-600">
              Please <Link href="/auth/login" className="text-blue-600 hover:underline">log in</Link> to leave a review.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitReview} className="mb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className="focus:outline-none"
                  >
                    <FaStar
                      className={`h-8 w-8 ${
                        value <= rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>
            
            <Button type="submit" disabled={isSubmitting || rating === 0}>
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </form>
        )}

        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.review_id} className="border-b border-gray-200 pb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">By {review.user_first_name || 'Anonymous'}</p>
                <p className="text-sm text-gray-500">
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <FaStar
                    key={i}
                    className={`h-5 w-5 ${
                      i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-gray-600">{review.comment}</p>
            </div>
          ))}
          
          {reviews.length === 0 && (
            <p className="text-gray-600 text-center">No reviews yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailsPage; 