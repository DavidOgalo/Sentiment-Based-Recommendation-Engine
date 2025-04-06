import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import { reviewsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Review {
  id: number;
  rating: number;
  comment: string;
  user_id: number;
  service_name: string;
  provider_name: string;
}

interface FormData {
  rating: number;
  comment: string;
}

export default function EditReviewPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [review, setReview] = useState<Review | null>(null);
  const [formData, setFormData] = useState<FormData>({
    rating: 5,
    comment: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchReview = async () => {
      if (!id) return;

      try {
        const response = await reviewsApi.getById(Number(id));
        const reviewData = response.data as Review;

        // Check if the user owns this review
        if (reviewData.user_id !== user.id) {
          router.back();
          return;
        }

        setReview(reviewData);
        setFormData({
          rating: reviewData.rating,
          comment: reviewData.comment,
        });
      } catch (error) {
        console.error('Failed to fetch review:', error);
        setError('Failed to load review');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReview();
  }, [id, user, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!review) return;

    setError('');
    setIsSaving(true);

    try {
      await reviewsApi.update(review.id, formData);
      router.back();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to update review');
      setIsSaving(false);
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

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      </Layout>
    );
  }

  if (!review) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-500">{error || 'Review not found'}</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Edit Review</h1>
          <p className="mt-1 text-sm text-gray-600">
            Update your review for {review.service_name} by {review.provider_name}
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