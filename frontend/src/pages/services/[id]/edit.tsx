import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import { servicesApi, categoriesApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Service {
  id: number;
  name: string;
  description: string;
  provider_id: number;
  category_id: number;
}

interface Category {
  id: number;
  name: string;
}

interface FormData {
  name: string;
  description: string;
  category_id: string;
}

export default function EditServicePage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [service, setService] = useState<Service | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    category_id: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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

    const fetchData = async () => {
      if (!id) return;

      try {
        const [serviceResponse, categoriesResponse] = await Promise.all([
          servicesApi.getById(Number(id)),
          categoriesApi.getAll(),
        ]);

        const serviceData = serviceResponse.data as Service;
        const categoriesData = categoriesResponse.data as Category[];

        // Check if the user is the owner of the service
        if (serviceData.provider_id !== user.id) {
          router.push('/services');
          return;
        }

        setService(serviceData);
        setFormData({
          name: serviceData.name,
          description: serviceData.description,
          category_id: String(serviceData.category_id),
        });
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError('Failed to load service details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, user, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!service) return;

    setError('');
    setIsSaving(true);

    try {
      await servicesApi.update(service.id, {
        ...formData,
        category_id: Number(formData.category_id),
      });
      router.push(`/services/${service.id}`);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to update service');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  if (error && !service) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Edit Service</h1>
          <p className="mt-1 text-sm text-gray-600">
            Update your service information.
          </p>
        </div>

        <div className="mt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Service Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                required
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category_id"
                name="category_id"
                required
                value={formData.category_id}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
} 