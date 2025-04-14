import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { recommendationsApi } from '@/lib/api';
import { Service } from '@/lib/api';
import { Spinner } from '@/components/common/Spinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { RecommendationFilters } from '@/components/recommendations/RecommendationFilters';
import { ServiceCard } from '@/components/services/ServiceCard';

export default function RecommendationsPage() {
  const { user } = useAuth();
  const [personalizedServices, setPersonalizedServices] = useState<Service[]>([]);
  const [trendingServices, setTrendingServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    min_rating: 0,
    category_id: undefined as number | undefined,
    include_reviewed: false,
    limit: 10
  });

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const [personalized, trending] = await Promise.all([
          recommendationsApi.getPersonalized(filters),
          recommendationsApi.getTrending({ limit: 5, days: 30 })
        ]);

        setPersonalizedServices(personalized);
        setTrendingServices(trending);
      } catch (err: any) {
        setError(err.message || 'Failed to load recommendations');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchRecommendations();
    }
  }, [user, filters]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to view recommendations</h2>
          <p className="text-gray-600">Sign in to get personalized service recommendations based on your preferences and reviews.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Recommendations</h1>
        <p className="text-gray-600">Services tailored to your preferences and past interactions</p>
      </div>

      <RecommendationFilters filters={filters} onFilterChange={setFilters} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {personalizedServices.map((service) => (
          <ServiceCard key={service.service_id} service={service} />
        ))}
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Trending Services</h2>
        <p className="text-gray-600">Popular services based on recent reviews and interactions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trendingServices.map((service) => (
          <ServiceCard key={service.service_id} service={service} />
        ))}
      </div>
    </div>
  );
} 