import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../../contexts/AuthContext';
import { servicesApi, categoriesApi } from '../../../../lib/api';
import { Service, Category } from '../../../../lib/api';

export default function EditServicePage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [service, setService] = useState<Service | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    price_range: {
      min: '',
      max: ''
    },
    duration_minutes: '',
    is_active: true
  });

  useEffect(() => {
    if (id) {
      fetchService();
      fetchCategories();
    }
  }, [id]);

  const fetchService = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid service ID');
      }
      const data = await servicesApi.getById(Number(id));
      if (!data) {
        throw new Error('Service not found');
      }
      setService(data);
      setFormData({
        name: data.name,
        description: data.description || '',
        category_id: data.category_id.toString(),
        price_range: {
          min: data.price_range.min.toString(),
          max: data.price_range.max.toString()
        },
        duration_minutes: data.duration_minutes.toString(),
        is_active: data.is_active
      });
    } catch (err) {
      console.error('Error fetching service:', err);
      setError('Failed to load service. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await categoriesApi.getAll();
      setCategories(data);
    } catch (err) {
      setError('Failed to load categories');
      console.error('Error fetching categories:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid service ID');
      }
      setError(null);
      await servicesApi.update(Number(id), {
        name: formData.name,
        description: formData.description,
        category_id: parseInt(formData.category_id),
        price_range: {
          min: parseFloat(formData.price_range.min),
          max: parseFloat(formData.price_range.max)
        },
        duration_minutes: parseInt(formData.duration_minutes),
        is_active: formData.is_active
      });
      router.push('/provider/dashboard');
    } catch (err) {
      console.error('Error updating service:', err);
      setError('Failed to update service. Please try again later.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name.startsWith('price_range.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        price_range: {
          ...prev.price_range,
          [field]: value
        }
      }));
    } else if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!service) {
    return <div className="flex justify-center items-center h-screen">Service not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Service</h1>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
            Service Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows={4}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category_id">
            Category
          </label>
          <select
            id="category_id"
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          >
            {categories.map(category => (
              <option key={category.category_id} value={category.category_id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="price_range.min">
              Minimum Price
            </label>
            <input
              type="number"
              id="price_range.min"
              name="price_range.min"
              value={formData.price_range.min}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="price_range.max">
              Maximum Price
            </label>
            <input
              type="number"
              id="price_range.max"
              name="price_range.max"
              value={formData.price_range.max}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="duration_minutes">
            Duration (minutes)
          </label>
          <input
            type="number"
            id="duration_minutes"
            name="duration_minutes"
            value={formData.duration_minutes}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
            min="1"
          />
        </div>

        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span className="ml-2 text-gray-700">Active</span>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push('/provider/dashboard')}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Update Service
          </button>
        </div>
      </form>
    </div>
  );
} 