import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { servicesApi, Service } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/common/Spinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';

const ServicesPage = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const servicesData = await servicesApi.getAll();
        setServices(servicesData);
      } catch (err) {
        setError('Failed to load services');
        console.error('Error fetching services:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Available Services</h1>
      
      {services.length === 0 ? (
        <p className="text-gray-600 text-center">No services available at the moment.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Link
              key={service.service_id}
              href={`/services/${service.service_id}`}
              className="block bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300"
            >
              <h2 className="text-xl font-semibold mb-2">{service.name}</h2>
              <p className="text-gray-600 mb-4">{service.description}</p>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  Category: {service.category_name}
                </p>
                <p className="text-sm text-gray-500">
                  Provider: {service.provider_name}
                </p>
                <p className="text-sm text-gray-500">
                  Price Range: ${service.price_range.min} - ${service.price_range.max}
                </p>
                <p className="text-sm text-gray-500">
                  Rating: {service.average_rating.toFixed(1)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServicesPage; 