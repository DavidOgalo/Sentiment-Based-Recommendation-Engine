import React from 'react';
import Link from 'next/link';
import { Service } from '@/lib/api';

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-300">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {service.name}
          </h3>
          <div className="flex items-center">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`h-4 w-4 ${
                    i < service.average_rating
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            by {service.provider_name}
          </p>
          <p className="text-sm text-gray-500">
            Category: {service.category_name}
          </p>
          <p className="text-sm text-gray-600">
            {service.description}
          </p>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-900 font-medium">
              ${service.price_range.min} - ${service.price_range.max}
            </p>
            <p className="text-sm text-gray-500">
              {service.duration_minutes} minutes
            </p>
          </div>
        </div>

        <div className="mt-4">
          <Link
            href={`/services/${service.service_id}`}
            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
} 