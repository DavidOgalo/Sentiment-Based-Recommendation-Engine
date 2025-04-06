import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import { reviewsApi, servicesApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Service {
  id: number;
  name: string;
  provider_name: string;
  provider_id: number;
}

interface FormData {
  rating: number;
  comment: string;
}

export default function CreateReviewPage() {
  const router = useRouter();
  const { service_id } = router.query;
  const { user } = useAuth();
  const [service, setService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<FormData>({
    rating: 5,
    comment: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchService = async () => {
      if (!service_id) return;

      try {
        const response = await servicesApi.getById(Number(service_id));
        const serviceData = response.data as Service;

        // Prevent providers from reviewing their own services
        if (serviceData.provider_id === user.id) {
          router.push(`/services/${service_id}`);
          return;
        }

        setService(serviceData);
      } catch (error) {
        console.error('Failed to fetch service:', error);
        setError('Failed to load service details');
      }
    };

    fetchService();
  }, [service_id, user, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!service) return;

    setError('');
    setIsLoading(true);

    try {
      await reviewsApi.create({
        service_id: service.id,
        ...formData,
      });
      router.push(`/services/${service.id}`);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to create review');
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'rating' ? Number(value) : value,
    }));
  };

  if (!service) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <h1 className="text-2xl font-bold text-gray-900">Write a Review</h1>
          <p className="mt-1 text-sm text-gray-600">
            Share your experience with {service.name} by {service.provider_name}
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
              <label htmlFor="rating" className="block text-sm font-medium text-gray-700">
                Rating
              </label>
              <div className="mt-1 flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, rating: value }))}
                    className="focus:outline-none"
                  >
                    <svg
                      className={`h-8 w-8 ${
                        value <= formData.rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 15.585l-7.07 3.714 1.35-7.858L.72 7.227l7.88-1.144L10 0l2.4 6.083 7.88 1.144-5.56 5.214 1.35 7.858z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                ))}
                <input
                  type="hidden"
                  name="rating"
                  value={formData.rating}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
                Your Review
              </label>
              <textarea
                id="comment"
                name="comment"
                rows={4}
                required
                placeholder="Share your experience with this service..."
                value={formData.comment}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
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
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
} 