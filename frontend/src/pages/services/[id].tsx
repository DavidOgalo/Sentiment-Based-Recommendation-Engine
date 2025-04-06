import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import { servicesApi, reviewsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Service {
  id: number;
  name: string;
  description: string;
  provider_name: string;
  provider_id: number;
  average_rating: number;
  category_name: string;
}

interface Review {
  id: number;
  rating: number;
  comment: string;
  sentiment_score: number;
  created_at: string;
  user_name: string;
  user_id: number;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export default function ServiceDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [service, setService] = useState<Service | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!id || typeof id !== 'string') return;

      try {
        const [serviceResponse, reviewsResponse] = await Promise.all([
          servicesApi.getById(Number(id)),
          reviewsApi.getByServiceId(Number(id)),
        ]);

        const serviceData = serviceResponse.data as Service;
        const reviewsData = reviewsResponse.data as Review[];

        if (!serviceData) {
          throw new Error('Service not found');
        }

        setService(serviceData);
        setReviews(reviewsData);
      } catch (error: any) {
        console.error('Failed to fetch data:', error);
        setError(error.message || 'Failed to load service details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const getSentimentColor = (score: number): string => {
    if (score >= 0.5) return 'text-green-600';
    if (score <= -0.5) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getSentimentLabel = (score: number): string => {
    if (score >= 0.5) return 'Positive';
    if (score <= -0.5) return 'Negative';
    return 'Neutral';
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      </Layout>
    );
  }

  if (error || !service) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-500">{error || 'Service not found'}</p>
          <Link href="/services" className="mt-4 text-indigo-600 hover:text-indigo-500">
            Back to Services
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Service details */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{service.name}</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Provided by{' '}
                  <Link
                    href={`/providers/${service.provider_id}`}
                    className="text-indigo-600 hover:text-indigo-500"
                  >
                    {service.provider_name}
                  </Link>
                </p>
              </div>
              <div className="flex items-center">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.round(service.average_rating)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
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
                <p className="ml-2 text-sm text-gray-500">
                  {service.average_rating.toFixed(1)} rating
                </p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="text-sm text-gray-500">{service.description}</div>
            <div className="mt-4">
              <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                {service.category_name}
              </span>
            </div>
          </div>
        </div>

        {/* Reviews section */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Reviews</h2>
            {user && user.id !== service.provider_id && (
              <Link
                href={`/reviews/create?service_id=${service.id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Write a Review
              </Link>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-12 bg-white shadow sm:rounded-lg">
              <p className="text-gray-500">No reviews yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white shadow overflow-hidden sm:rounded-lg"
                >
                  <div className="px-4 py-5 sm:px-6">
                    <div className="flex justify-between items-start">
                      <div>
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
                          <span className="ml-2 text-sm text-gray-500">
                            {review.rating} out of 5
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          by {review.user_name} •{' '}
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSentimentColor(
                          review.sentiment_score
                        )}`}
                      >
                        {getSentimentLabel(review.sentiment_score)}
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-gray-500">{review.comment}</p>
                    {user?.id === review.user_id && (
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
          )}
        </div>
      </div>
    </Layout>
  );
} 