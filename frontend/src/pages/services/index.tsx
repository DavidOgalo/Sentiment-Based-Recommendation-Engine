import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { servicesApi, Service, categoriesApi, Category } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/common/Spinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { useRouter } from 'next/router';
import { Button } from '@/components/common/Button';

const ServicesPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  const fetchServices = async (pageNum: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const limit = 20; // Request 20 services per page
      const offset = (pageNum - 1) * limit;
      
      const [servicesData, categoriesData] = await Promise.all([
        servicesApi.getAll({ limit, offset }),
        categoriesApi.getAll()
      ]);
      
      if (!Array.isArray(servicesData)) {
        throw new Error('Invalid response format from services API');
      }
      
      if (pageNum === 1) {
        setServices(servicesData);
        setFilteredServices(servicesData);
      } else {
        setServices(prev => [...prev, ...servicesData]);
        setFilteredServices(prev => [...prev, ...servicesData]);
      }
      
      setCategories(categoriesData);
      setHasMore(servicesData.length === limit);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError('Failed to load services. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices(1);
  }, []);

  const loadMore = () => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
      fetchServices(page + 1);
    }
  };

  // Apply filters whenever filter states change
  useEffect(() => {
    let filtered = [...services];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(service => 
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.provider_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(service => service.category_id === selectedCategory);
    }

    // Apply price range filter
    if (priceRange.min) {
      filtered = filtered.filter(service => service.price_range.min >= Number(priceRange.min));
    }
    if (priceRange.max) {
      filtered = filtered.filter(service => service.price_range.max <= Number(priceRange.max));
    }

    setFilteredServices(filtered);
  }, [services, searchTerm, selectedCategory, priceRange]);

  if (isLoading && page === 1) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <ErrorMessage 
          message={error} 
          onRetry={() => window.location.reload()} 
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Available Services</h1>
      
      {/* Filters */}
      <div className="mb-8 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Bar */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by service or provider"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : '')}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.category_id} value={category.category_id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range Filter */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700">
                Min Price
              </label>
              <input
                type="number"
                id="minPrice"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                placeholder="Min"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700">
                Max Price
              </label>
              <input
                type="number"
                id="maxPrice"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                placeholder="Max"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>
      
      {filteredServices.length === 0 ? (
        <p className="text-gray-600 text-center">No services match your filters.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <Link
                key={service.service_id}
                href={`/services/${service.service_id}`}
                className="block bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300"
              >
                <h2 className="text-xl font-semibold mb-2">{service.name}</h2>
                <p className="text-gray-600 mb-4">{service.description}</p>
                
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">
                    Category: {service.category_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Provider: {service.provider_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Price Range: ${service.price_range.min} - ${service.price_range.max}
                  </p>
                  <p className="text-sm text-gray-500">
                    Rating: {service.average_rating.toFixed(1)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          
          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ServicesPage; 