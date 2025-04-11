import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { servicesApi, reviewsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Service {
  id: number;
  name: string;
  description: string;
  provider_id: number;
  provider_name: string;
  average_rating: number;
  category_id: number;
  category_name: string;
}

interface Review {
  id: number;
  rating: number;
  comment: string;
  user_name: string;
  created_at: string;
}

export default function ServiceDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [service, setService] = useState<Service | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const [serviceResponse, reviewsResponse] = await Promise.all([
          servicesApi.getById(Number(id)),
          reviewsApi.getByServiceId(Number(id)),
        ]);
        setService(serviceResponse.data as Service);
        setReviews(reviewsResponse.data as Review[]);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError('Failed to load service details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error || 'Service not found'}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-indigo-600 hover:text-indigo-500"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">{service.name}</h1>
            <div className="flex items-center space-x-4">
              {user?.id === service.provider_id && (
                <>
                  <Link
                    href={`/services/${service.id}/edit`}
                    className="text-indigo-600 hover:text-indigo-500"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/services/${service.id}/delete`}
                    className="text-red-600 hover:text-red-500"
                  >
                    Delete
                  </Link>
                </>
              )}
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500">{service.description}</p>
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Provider</dt>
              <dd className="mt-1 text-sm text-gray-900">{service.provider_name}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Category</dt>
              <dd className="mt-1 text-sm text-gray-900">{service.category_name}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Rating</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {service.average_rating.toFixed(1)} ★
              </dd>
            </div>
          </dl>
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900">Reviews</h2>
          {reviews.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No reviews yet.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {review.user_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="mt-1 flex items-center">
                    <span className="text-sm text-gray-500">
                      {review.rating} ★
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
          {user && (
            <div className="mt-6">
              <Link
                href={`/reviews/create?service_id=${service.id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Write a Review
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 