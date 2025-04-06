import React, { useEffect, useState } from 'react';
import { recommendationsApi } from '@/lib/api';
import Layout from '@/components/layout/Layout';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface Recommendation {
  service_id: number;
  service_name: string;
  provider_name: string;
  category_name: string;
  average_rating: number;
  sentiment_score: number;
  match_score: number;
  price: number;
  total_reviews: number;
}

const RecommendationsPage = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    category: '',
    minRating: '',
    maxPrice: '',
    sortBy: 'match_score',
  });

  useEffect(() => {
    if (!user) return;

    const fetchRecommendations = async () => {
      try {
        const params: any = { ...filters };
        if (params.category) params.category_id = parseInt(params.category);
        if (params.minRating) params.min_rating = parseFloat(params.minRating);
        if (params.maxPrice) params.max_price = parseFloat(params.maxPrice);
        
        const response = await recommendationsApi.get(params);
        setRecommendations(response.data);
      } catch (err) {
        setError('Failed to fetch recommendations');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [user, filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-blue-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMatchLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent Match';
    if (score >= 0.6) return 'Good Match';
    if (score >= 0.4) return 'Fair Match';
    return 'Poor Match';
  };

  if (!user) {
    return (
      <Layout>
        <div className="text-center">
          <p className="text-gray-500">Please log in to view recommendations.</p>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Personalized Recommendations
        </h1>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">All Categories</option>
                {/* Add category options dynamically */}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Minimum Rating
              </label>
              <input
                type="number"
                name="minRating"
                min="1"
                max="5"
                step="0.1"
                value={filters.minRating}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Maximum Price
              </label>
              <input
                type="number"
                name="maxPrice"
                min="0"
                step="0.01"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Sort By
              </label>
              <select
                name="sortBy"
                value={filters.sortBy}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="match_score">Match Score</option>
                <option value="rating">Rating</option>
                <option value="price">Price</option>
              </select>
            </div>
          </div>
        </div>

        {error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : recommendations.length === 0 ? (
          <div className="text-center text-gray-500">
            No recommendations found. Try adjusting your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((recommendation) => (
              <div
                key={recommendation.service_id}
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-300"
              >
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {recommendation.service_name}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMatchScoreColor(
                        recommendation.match_score
                      )}`}
                    >
                      {getMatchLabel(recommendation.match_score)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">
                      by {recommendation.provider_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Category: {recommendation.category_name}
                    </p>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500">Rating:</span>
                      <div className="flex items-center ml-2">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`h-4 w-4 ${
                              i < recommendation.average_rating
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="ml-1 text-sm text-gray-600">
                          ({recommendation.total_reviews})
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-900 font-medium">
                      ${recommendation.price}
                    </p>
                  </div>
                  <div className="mt-4">
                    <Link
                      href={`/services/${recommendation.service_id}`}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RecommendationsPage; 