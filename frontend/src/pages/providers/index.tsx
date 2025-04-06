import React, { useEffect, useState } from 'react';
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
  total_services: number;
}

const ProvidersPage = () => {
  const { user } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await providersApi.list();
        setProviders(response.data);
      } catch (err) {
        setError('Failed to fetch providers');
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  const handleVerify = async (providerId: number, isVerified: boolean) => {
    try {
      if (isVerified) {
        await providersApi.unverify(providerId);
      } else {
        await providersApi.verify(providerId);
      }
      // Refresh the providers list
      const response = await providersApi.list();
      setProviders(response.data);
    } catch (err) {
      setError('Failed to update provider verification status');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center">Loading...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center text-red-500">{error}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Service Providers</h1>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    {provider.name}
                  </h3>
                  {provider.is_verified && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Verified
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">{provider.description}</p>
                <div className="mt-4 space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      Rating:
                    </span>{' '}
                    <span className="text-sm text-gray-900">
                      {provider.average_rating.toFixed(1)}/5.0
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      Services:
                    </span>{' '}
                    <span className="text-sm text-gray-900">
                      {provider.total_services}
                    </span>
                  </div>
                </div>
                <div className="mt-6 flex justify-between items-center">
                  <Link
                    href={`/providers/${provider.id}`}
                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                  >
                    View Profile
                  </Link>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => handleVerify(provider.id, provider.is_verified)}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        provider.is_verified
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {provider.is_verified ? 'Unverify' : 'Verify'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default ProvidersPage; 