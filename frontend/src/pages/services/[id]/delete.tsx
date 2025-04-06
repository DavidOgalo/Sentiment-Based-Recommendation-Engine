import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import { servicesApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Service {
  id: number;
  name: string;
  description: string;
  provider_id: number;
  provider_name: string;
}

export default function DeleteServicePage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Redirect if not logged in or not a provider
    if (!user) {
      router.push('/login');
      return;
    }
    if (!user.is_provider) {
      router.push('/services');
      return;
    }

    const fetchService = async () => {
      if (!id) return;

      try {
        const response = await servicesApi.getById(Number(id));
        const serviceData = response.data as Service;

        // Check if the user is the owner of the service
        if (serviceData.provider_id !== user.id) {
          router.push('/services');
          return;
        }

        setService(serviceData);
      } catch (error) {
        console.error('Failed to fetch service:', error);
        setError('Failed to load service details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchService();
  }, [id, user, router]);

  const handleDelete = async () => {
    if (!service) return;

    setError('');
    setIsDeleting(true);

    try {
      await servicesApi.delete(service.id);
      router.push('/services');
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to delete service');
      setIsDeleting(false);
    }
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

  if (error || !service) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-500">{error || 'Service not found'}</p>
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
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <h1 className="text-2xl font-bold text-gray-900">Delete Service</h1>
          <p className="mt-1 text-sm text-gray-600">
            Are you sure you want to delete this service? This action cannot be undone.
          </p>
        </div>

        <div className="mt-6">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {service.name}
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>{service.description}</p>
              </div>
              {error && (
                <div className="mt-4 rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}
              <div className="mt-5 flex space-x-4">
                <Link
                  href={`/services/${service.id}`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </Link>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Service'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 