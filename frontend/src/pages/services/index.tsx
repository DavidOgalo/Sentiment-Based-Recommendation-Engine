import React, { useEffect, useState } from 'react';
import { servicesApi } from '@/lib/api';
import Layout from '@/components/layout/Layout';
import Link from 'next/link';

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  category: {
    name: string;
  };
  provider: {
    name: string;
  };
  average_rating: number;
}

const ServicesPage = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await servicesApi.getAll();
        setServices(response.data);
      } catch (err) {
        setError('Failed to fetch services');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          <Link
            href="/services/create"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
          >
            Add Service
          </Link>
        </div>
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
                    Provider:
                  </span>{' '}
                  <span className="text-sm text-gray-900">
                    {service.provider.name}
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
    </Layout>
  );
};

export default ServicesPage; 