import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import { servicesApi, categoriesApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Service {
  id: number;
  name: string;
  description: string;
  provider_name: string;
  average_rating: number;
  category_id: number;
  category_name: string;
}

interface Category {
  id: number;
  name: string;
}

export default function ServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesResponse, categoriesResponse] = await Promise.all([
          servicesApi.getAll({ search: searchQuery, category_id: selectedCategory || undefined }),
          categoriesApi.getAll(),
        ]);
        setServices(servicesResponse.data as Service[]);
        setCategories(categoriesResponse.data as Category[]);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory, searchQuery]);

  const filteredServices = services.filter((service) => {
    if (selectedCategory && service.category_id !== selectedCategory) {
      return false;
    }
    if (searchQuery) {
      return (
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          {user?.is_provider && (
            <Link
              href="/services/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Add New Service
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              id="category"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              type="text"
              id="search"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service) => (
            <Link
              key={service.id}
              href={`/services/${service.id}`}
              className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">{service.name}</h3>
                <p className="mt-2 text-sm text-gray-500">{service.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {service.provider_name}
                  </span>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500">
                      {service.average_rating.toFixed(1)} ★
                    </span>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {service.category_name}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No services found matching your criteria.</p>
          </div>
        )}
      </div>
    </Layout>
  );
} 