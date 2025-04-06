import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { providersApi, servicesApi, reviewsApi } from '@/lib/api';
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

const ProviderDetailsPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const [providerResponse, servicesResponse, reviewsResponse] = await Promise.all([
          providersApi.getById(Number(id)),
          servicesApi.list({ provider_id: Number(id) }),
          reviewsApi.list({ provider_id: Number(id) }),
        ]);

        setProvider(providerResponse.data);
        setServices(servicesResponse.data);
        setReviews(reviewsResponse.data);
      } catch (err) {
        setError('Failed to fetch provider details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleVerify = async () => {
    if (!provider) return;

    try {
      if (provider.is_verified) {
        await providersApi.unverify(provider.id);
      } else {
        await providersApi.verify(provider.id);
      }
      // Refresh provider data
      const response = await providersApi.getById(Number(id));
      setProvider(response.data);
    } catch (err) {
      setError('Failed to update verification status');
    }
  };

  const getSentimentColor = (score: number) => {
    if (score >= 0.6) return 'text-green-600';
    if (score >= 0.3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSentimentLabel = (score: number) => {
    if (score >= 0.6) return 'Positive';
    if (score >= 0.3) return 'Neutral';
    return 'Negative';
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center">Loading...</div>
      </Layout>
    );
  }

  if (error || !provider) {
    return (
      <Layout>
        <div className="text-center text-red-500">
          {error || 'Provider not found'}
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
            {user?.role === 'admin' && (
              <div className="mt-6">
                <button
                  onClick={handleVerify}
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
                                i < review.rating
                                  ? 'text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
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
                    <p className="mt-4 text-gray-700">{review.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProviderDetailsPage; 