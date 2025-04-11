import { useEffect, useState } from 'react';
import Link from 'next/link';
import { servicesApi } from '@/lib/api';

interface Service {
  id: number;
  name: string;
  description: string;
  provider_name: string;
  average_rating: number;
  category_id: number;
  category_name: string;
}

export default function HomePage() {
  const [featuredServices, setFeaturedServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedServices = async () => {
      try {
        const response = await servicesApi.getAll({ search: '', category_id: undefined });
        setFeaturedServices(response.data as Service[]);
      } catch (error) {
        console.error('Failed to fetch featured services:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedServices();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
          Find the Perfect Service
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          Discover and book services from verified providers in your area.
        </p>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900">Featured Services</h2>
        <div className="mt-6 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {featuredServices.map((service) => (
            <Link
              key={service.id}
              href={`/services/${service.id}`}
              className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">{service.name}</h3>
                <p className="mt-2 text-sm text-gray-500">{service.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {service.provider_name}
                  </span>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500">
                      {service.average_rating.toFixed(1)} ★
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/services"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Browse All Services
        </Link>
      </div>
    </div>
  );
} 