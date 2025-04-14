import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { providersApi, servicesApi, authApi } from '../../lib/api';
import { Provider, Service } from '../../lib/api';

export default function ProviderDashboard() {
  const { user } = useAuth();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'services'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    description: '',
    contact_phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    website: '',
    contact_email: '',
  });

  const fetchProviderData = async () => {
    try {
      setLoading(true);
      const currentUser = await authApi.getCurrentUser();
      if (currentUser) {
        const providerData = await providersApi.getByUserId(currentUser.user_id);
        setProvider(providerData);
        const servicesData = await servicesApi.getByProvider(providerData.provider_id);
        setServices(servicesData);
      }
    } catch (error) {
      console.error('Error fetching provider data:', error);
      setError('Failed to load provider data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProviderData();
    }
  }, [user]);

  useEffect(() => {
    if (provider) {
      setFormData({
        business_name: provider.business_name,
        description: provider.description || '',
        contact_phone: provider.contact_phone || '',
        address: provider.address || '',
        city: provider.city || '',
        state: provider.state || '',
        zip_code: provider.zip_code || '',
        website: provider.website || '',
        contact_email: provider.contact_email || '',
      });
    }
  }, [provider]);

  const handleServiceStatus = async (serviceId: number, isActive: boolean) => {
    try {
      setError(null);
      await servicesApi.update(serviceId, { is_active: isActive });
      // Refresh services list
      if (provider) {
        const updatedServices = await servicesApi.getByProvider(provider.provider_id);
        setServices(updatedServices);
      }
    } catch (err) {
      console.error('Error updating service status:', err);
      setError('Failed to update service status');
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!provider) return;
      
      const updatedProvider = await providersApi.update(provider.provider_id, {
        ...formData,
        services_offered: services.map(s => s.name)
      });
      
      setProvider(updatedProvider);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => {
            if (user) fetchProviderData();
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-500 mb-4">No provider profile found. Please create a provider profile.</p>
        <button
          onClick={() => window.location.href = '/provider/create'}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create Provider Profile
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Provider Dashboard</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded ${
              activeTab === 'profile' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 rounded ${
              activeTab === 'services' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Services
          </button>
        </div>
      </div>

      {activeTab === 'profile' && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Profile Information</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
          
          {isEditing ? (
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Business Name</label>
                <input
                  type="text"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Zip Code</label>
                <input
                  type="text"
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Website</label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Business Name</p>
                <p className="font-medium">{provider?.business_name}</p>
              </div>
              <div>
                <p className="text-gray-600">Description</p>
                <p className="font-medium">{provider?.description}</p>
              </div>
              <div>
                <p className="text-gray-600">Contact Phone</p>
                <p className="font-medium">{provider?.contact_phone}</p>
              </div>
              <div>
                <p className="text-gray-600">Address</p>
                <p className="font-medium">{provider?.address}</p>
              </div>
              <div>
                <p className="text-gray-600">Verification Status</p>
                <p className={`font-medium ${provider?.is_verified ? 'text-green-600' : 'text-amber-600'}`}>
                  {provider?.is_verified ? 'Verified' : 'Pending Verification'}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Average Rating</p>
                <p className="font-medium">{provider?.average_rating?.toFixed(1) || '0.0'} / 5.0</p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'services' && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">My Services</h2>
            <button
              onClick={() => window.location.href = '/provider/services/new'}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Service
            </button>
          </div>
          
          {services.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">You haven't added any services yet.</p>
              <p className="text-gray-500 mt-2">Click the "Add Service" button to create your first service.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price Range</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {services.map((service) => (
                  <tr key={service.service_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{service.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{service.category_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${service.price_range.min} - ${service.price_range.max}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleServiceStatus(service.service_id, !service.is_active)}
                        className={`px-2 py-1 rounded ${
                          service.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {service.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => window.location.href = `/provider/services/${service.service_id}/edit`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}