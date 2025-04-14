import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { providersApi, Provider } from '@/lib/api';
import { Spinner } from '@/components/common/Spinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [minRating, setMinRating] = useState<number | ''>('');

  // Fetch all providers on initial load
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await providersApi.getAll();
        setProviders(data || []);
        setFilteredProviders(data || []);
      } catch (err) {
        console.error('Error fetching providers:', err);
        setError('Failed to load service providers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProviders();
  }, []);

  // Apply filters in real-time
  useEffect(() => {
    let filtered = [...providers];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(provider => 
        provider.business_name.toLowerCase().includes(searchLower) ||
        provider.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply verification filter
    if (isVerified !== null) {
      filtered = filtered.filter(provider => provider.is_verified === isVerified);
    }

    // Apply rating filter
    if (minRating !== '') {
      filtered = filtered.filter(provider => 
        provider.average_rating >= Number(minRating)
      );
    }

    setFilteredProviders(filtered);
  }, [providers, searchTerm, isVerified, minRating]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ErrorMessage message={error} onRetry={() => window.location.reload()} />
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

      {/* Filters */}
      <div className="mb-8 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Bar */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or description"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* Verification Status */}
          <div>
            <label htmlFor="verified" className="block text-sm font-medium text-gray-700">
              Verification Status
            </label>
            <select
              id="verified"
              value={isVerified === null ? '' : isVerified.toString()}
              onChange={(e) => setIsVerified(e.target.value === '' ? null : e.target.value === 'true')}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">All Providers</option>
              <option value="true">Verified Only</option>
              <option value="false">Unverified Only</option>
            </select>
          </div>

          {/* Minimum Rating */}
          <div>
            <label htmlFor="minRating" className="block text-sm font-medium text-gray-700">
              Minimum Rating
            </label>
            <select
              id="minRating"
              value={minRating}
              onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : '')}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Any Rating</option>
              <option value="4">4+ Stars</option>
              <option value="3">3+ Stars</option>
              <option value="2">2+ Stars</option>
              <option value="1">1+ Stars</option>
            </select>
          </div>
        </div>
      </div>

      {filteredProviders.length === 0 ? (
        <div className="text-center text-gray-500">
          <p>No service providers match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProviders.map((provider) => (
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