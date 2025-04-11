import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { providersApi, Provider, Service } from '@/lib/api';
import Link from 'next/link';

export default function ProviderDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [provider, setProvider] = useState<Provider | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviderDetails = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch provider details
        const providerData = await providersApi.getById(Number(id));
        setProvider(providerData);
        
        // Fetch provider services
        try {
          const servicesData = await providersApi.getServices(Number(id));
          setServices(servicesData || []);
        } catch (servicesError) {
          console.warn('No services found for this provider');
          setServices([]);
        }
      } catch (err) {
        console.error('Error fetching provider details:', err);
        setError('Failed to load provider details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProviderDetails();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center text-red-600">
          <p>{error || 'Provider not found'}</p>
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
              <h1 className="text-3xl font-bold text-gray-900">{provider.business_name}</h1>
              {provider.is_verified && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                  Verified Provider
                </span>
              )}
            </div>
            <div className="flex items-center">
              <span className="text-yellow-400">★</span>
              <span className="ml-1 text-gray-900">
                {(provider.average_rating || 0).toFixed(1)}
              </span>
              <span className="ml-2 text-sm text-gray-500">
                ({provider.total_reviews || 0} reviews)
              </span>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
            <p className="text-gray-600">{provider.description}</p>
          </div>

          {provider.contact_phone && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500">Contact</h3>
              <p className="mt-1 text-gray-900">{provider.contact_phone}</p>
            </div>
          )}

          {provider.address && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500">Address</h3>
              <p className="mt-1 text-gray-900">{provider.address}</p>
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Services Offered</h2>
            {services.length === 0 ? (
              <p className="text-gray-600">No services available at the moment.</p>
            ) : (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((service) => (
                  <Link
                    key={service.service_id}
                    href={`/services/${service.service_id}`}
                    className="block bg-gray-50 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
                  >
                    <div className="p-4">
                      <h3 className="text-lg font-medium text-gray-900">{service.name}</h3>
                      <p className="mt-2 text-sm text-gray-500">{service.description}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm font-medium text-indigo-600">
                          ${service.price_range.min} - ${service.price_range.max}
                        </span>
                        <span className="text-sm text-gray-500">
                          {service.duration_minutes} min
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 