import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { servicesApi, Service } from '@/lib/api';

export default function HomePage() {
  const [featuredServices, setFeaturedServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedServices = async () => {
      try {
        const services = await servicesApi.getAll();
        setFeaturedServices(services || []);
      } catch (err) {
        setError('Failed to load featured services');
        setFeaturedServices([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedServices();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      ) : (
        <>
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Our Service Platform
            </h1>
            <p className="text-xl text-gray-600">
              Discover and book services from verified providers
            </p>
          </div>

          {featuredServices.length === 0 ? (
            <div className="text-center text-gray-500">
              <p>No services available at the moment.</p>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {featuredServices.map((service) => (
                <Link
                  key={service.service_id}
                  href={`/services/${service.service_id}`}
                  className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-gray-900">{service.name}</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {service.category_name}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">{service.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {service.provider_name}
                        </span>
                        <div className="flex items-center mt-1">
                          <span className="text-sm text-gray-500">
                            {(service.average_rating || 0).toFixed(1)} ★
                          </span>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-indigo-600">
                        ${service.price_range.min} - ${service.price_range.max}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
} 