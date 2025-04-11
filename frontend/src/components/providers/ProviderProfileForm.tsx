import React, { useState, useEffect } from 'react';
import { providersApi, Provider } from '@/lib/api';

interface BusinessHours {
  open: string;
  close: string;
}

interface BusinessHoursMap {
  monday: BusinessHours;
  tuesday: BusinessHours;
  wednesday: BusinessHours;
  thursday: BusinessHours;
  friday: BusinessHours;
  saturday: BusinessHours;
  sunday: BusinessHours;
}

interface ProviderProfileFormProps {
  providerId?: number;
  onSuccess?: () => void;
}

const ProviderProfileForm = ({ providerId, onSuccess }: ProviderProfileFormProps) => {
  const [formData, setFormData] = useState<Partial<Provider>>({
    business_name: '',
    description: '',
    contact_phone: '',
    address: '',
    latitude: undefined,
    longitude: undefined,
    business_hours: {
      monday: { open: '', close: '' },
      tuesday: { open: '', close: '' },
      wednesday: { open: '', close: '' },
      thursday: { open: '', close: '' },
      friday: { open: '', close: '' },
      saturday: { open: '', close: '' },
      sunday: { open: '', close: '' }
    },
    services_offered: {}
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (providerId) {
      loadProviderProfile();
    }
  }, [providerId]);

  const loadProviderProfile = async () => {
    try {
      const response = await providersApi.getById(providerId!);
      const data = response.data;
      setFormData({
        business_name: data.business_name,
        description: data.description,
        contact_phone: data.contact_phone,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        business_hours: data.business_hours,
        services_offered: data.services_offered
      });
    } catch (err) {
      setError('Failed to load provider profile');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: Partial<Provider>) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBusinessHoursChange = (day: keyof BusinessHoursMap, field: keyof BusinessHours, value: string) => {
    setFormData((prev: Partial<Provider>) => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: {
          ...prev.business_hours?.[day],
          [field]: value
        }
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (providerId) {
        await providersApi.update(providerId, {
          business_name: formData.business_name,
          description: formData.description,
          contact_phone: formData.contact_phone,
          address: formData.address,
          business_hours: formData.business_hours,
          services_offered: formData.services_offered
        });
      } else {
        await providersApi.create({
          business_name: formData.business_name!,
          description: formData.description!,
          contact_phone: formData.contact_phone,
          address: formData.address,
          business_hours: formData.business_hours,
          services_offered: formData.services_offered
        });
      }
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">
        {providerId ? 'Update Provider Profile' : 'Create Provider Profile'}
      </h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="business_name" className="block text-sm font-medium text-gray-700">
              Business Name
            </label>
            <input
              type="text"
              id="business_name"
              name="business_name"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.business_name}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700">
              Contact Phone
            </label>
            <input
              type="tel"
              id="contact_phone"
              name="contact_phone"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.contact_phone}
              onChange={handleChange}
            />
          </div>
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Address
          </label>
          <input
            type="text"
            id="address"
            name="address"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={formData.address}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              id="latitude"
              name="latitude"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.latitude || ''}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              id="longitude"
              name="longitude"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.longitude || ''}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Business Hours</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.keys(formData.business_hours || {}) as Array<keyof BusinessHoursMap>).map((day) => (
              <div key={day} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 capitalize">
                  {day}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="time"
                    value={formData.business_hours?.[day]?.open || ''}
                    onChange={(e) => handleBusinessHoursChange(day, 'open', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <input
                    type="time"
                    value={formData.business_hours?.[day]?.close || ''}
                    onChange={(e) => handleBusinessHoursChange(day, 'close', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isLoading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProviderProfileForm; 