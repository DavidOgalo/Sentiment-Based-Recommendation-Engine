import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { servicesApi, Service, Review } from '@/lib/api';

export default function ServiceDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [service, setService] = useState<Service | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch service details
        const serviceData = await servicesApi.getById(Number(id));
        setService(serviceData);
        
        // Fetch reviews
        try {
          const reviewsData = await servicesApi.getReviews(Number(id));
          setReviews(reviewsData || []);
        } catch (reviewError) {
          console.warn('No reviews found for this service');
          setReviews([]);
        }
      } catch (err) {
        console.error('Error fetching service details:', err);
        setError('Failed to load service details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchServiceDetails();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center text-red-600">
          <p>{error || 'Service not found'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{service.name}</h1>
              <p className="mt-2 text-lg text-gray-600">{service.description}</p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
              {service.category_name}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Service Details</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Provider</h3>
                  <p className="mt-1 text-lg text-gray-900">{service.provider_name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Duration</h3>
                  <p className="mt-1 text-lg text-gray-900">{service.duration_minutes} minutes</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Price Range</h3>
                  <p className="mt-1 text-lg text-gray-900">
                    ${service.price_range.min} - ${service.price_range.max}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Average Rating</h3>
                  <p className="mt-1 text-lg text-gray-900">
                    {service.average_rating ? service.average_rating.toFixed(1) : 'No ratings yet'} ★
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Reviews</h2>
              {reviews.length === 0 ? (
                <p className="text-gray-600">No reviews yet</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.review_id} className="border-b border-gray-200 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-lg font-medium text-gray-900">
                            {review.user_name}
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-yellow-400">★</span>
                          <span className="ml-1 text-gray-900">{review.rating}</span>
                        </div>
                      </div>
                      <p className="mt-2 text-gray-600">{review.comment}</p>
                      {review.sentiment_score !== null && (
                        <div className="mt-2">
                          <span className="text-sm text-gray-500">
                            Sentiment Score: {review.sentiment_score.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 