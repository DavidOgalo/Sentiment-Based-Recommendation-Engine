import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { providersApi, Provider } from '@/lib/api';

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await providersApi.getAll();
        setProviders(data || []);
      } catch (err) {
        console.error('Error fetching providers:', err);
        setError('Failed to load service providers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProviders();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Service Providers
        </h1>
        <p className="text-xl text-gray-600">
          Browse our verified service providers
        </p>
      </div>

      {providers.length === 0 ? (
        <div className="text-center text-gray-500">
          <p>No service providers available at the moment.</p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <Link
              key={provider.provider_id}
              href={`/providers/${provider.provider_id}`}
              className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium text-gray-900">{provider.business_name}</h3>
                  {provider.is_verified && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Verified
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-500">{provider.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500">
                      {(provider.average_rating || 0).toFixed(1)} ★
                    </span>
                    <span className="ml-2 text-sm text-gray-500">
                      ({provider.total_reviews || 0} reviews)
                    </span>
                  </div>
                  {provider.contact_phone && (
                    <div className="text-sm text-gray-500">
                      {provider.contact_phone}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 