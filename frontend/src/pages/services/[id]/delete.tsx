import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { servicesApi } from '@/lib/api';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';

interface Service {
  id: number;
  name: string;
  description: string;
  provider_id: number;
}

const DeleteServicePage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchService = async () => {
      if (!id) return;

      try {
        const response = await servicesApi.getById(Number(id));
        if (response.data.provider_id !== user?.id) {
          router.push('/services');
          return;
        }
        setService(response.data);
      } catch (err) {
        setError('Failed to fetch service details');
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [id, user, router]);

  const handleDelete = async () => {
    if (!service) return;

    setIsDeleting(true);
    setError(null);

    try {
      await servicesApi.delete(service.id);
      router.push('/services');
    } catch (err) {
      setError('Failed to delete service');
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center">Loading...</div>
      </Layout>
    );
  }

  if (error || !service) {
    return (
      <Layout>
        <div className="text-center text-red-500">
          {error || 'Service not found'}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h1 className="text-3xl font-bold text-gray-900">Delete Service</h1>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  Are you sure you want to delete this service?
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  This action cannot be undone. All reviews associated with this
                  service will also be deleted.
                </p>
              </div>

              <div className="bg-gray-50 px-4 py-5 sm:px-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{service.name}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">
                      Description
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {service.description}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.push('/services')}
                  disabled={isDeleting}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
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
};

export default DeleteServicePage; 