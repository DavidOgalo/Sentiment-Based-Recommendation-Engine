import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { providersApi } from '@/lib/api';
import Layout from '@/components/layout/Layout';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface Provider {
  id: number;
  name: string;
  email: string;
  description: string;
  is_verified: boolean;
  average_rating: number;
  bio: string;
}

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  category: {
    name: string;
  };
  average_rating: number;
}

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

interface User {
  id: number;
  name: string;
  email: string;
  is_provider: boolean;
  is_admin: boolean;
}

export default function ProviderDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const [providerResponse, servicesResponse, reviewsResponse] = await Promise.all([
          providersApi.getById(Number(id)),
          providersApi.getServices(Number(id)),
          providersApi.getReviews(Number(id)),
        ]);

        setProvider(providerResponse.data as Provider);
        setServices(servicesResponse.data as Service[]);
        setReviews(reviewsResponse.data as Review[]);
      } catch (error: any) {
        console.error('Failed to fetch provider details:', error);
        setError(error.response?.data?.detail || 'Failed to fetch provider details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleVerificationStatus = async () => {
    if (!provider || !user?.is_admin) return;

    try {
      await providersApi.update(provider.id, {
        name: provider.name,
        bio: provider.description,
        is_verified: !provider.is_verified,
      });
      
      // Refresh provider data
      const updatedProvider = await providersApi.getById(provider.id);
      setProvider(updatedProvider.data as Provider);
    } catch (error: any) {
      console.error('Failed to update verification status:', error);
      setError(error.response?.data?.detail || 'Failed to update verification status');
    }
  };

  const getSentimentColor = (score: number): string => {
    if (score >= 0.6) return 'text-green-600';
    if (score >= 0.3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSentimentLabel = (score: number): string => {
    if (score >= 0.6) return 'Positive';
    if (score >= 0.3) return 'Neutral';
    return 'Negative';
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

  if (error || !provider) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-500">{error || 'Provider not found'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-indigo-600 hover:text-indigo-500"
          >
            Go Back
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Provider Header */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{provider.name}</h1>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  {provider.description}
                </p>
              </div>
              {provider.is_verified && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Verified Provider
                </span>
              )}
            </div>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{provider.email}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Average Rating</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {provider.average_rating.toFixed(1)}/5.0
                </dd>
              </div>
            </dl>
            {user?.is_admin && (
              <div className="mt-6">
                <button
                  onClick={handleVerificationStatus}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    provider.is_verified
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {provider.is_verified ? 'Unverify Provider' : 'Verify Provider'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Services Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Services</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white overflow-hidden shadow rounded-lg"
              >
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    {service.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {service.description}
                  </p>
                  <div className="mt-4">
                    <span className="text-sm font-medium text-gray-500">
                      Category:
                    </span>{' '}
                    <span className="text-sm text-gray-900">
                      {service.category.name}
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm font-medium text-gray-500">
                      Price:
                    </span>{' '}
                    <span className="text-sm text-gray-900">${service.price}</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm font-medium text-gray-500">
                      Rating:
                    </span>{' '}
                    <span className="text-sm text-gray-900">
                      {service.average_rating.toFixed(1)}/5.0
                    </span>
                  </div>
                  <div className="mt-4">
                    <Link
                      href={`/services/${service.id}`}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Reviews</h2>
          {reviews.length === 0 ? (
            <p className="text-gray-500">No reviews yet.</p>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white shadow overflow-hidden sm:rounded-lg"
                >
                  <div className="px-4 py-5 sm:px-6">
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
                          className={`ml-2 text-sm font-medium ${getSentimentColor(
                            review.sentiment_score
                          )}`}
                        >
                          {getSentimentLabel(review.sentiment_score)}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">{review.comment}</p>
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