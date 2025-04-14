import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import Link from 'next/link';

export default function AdminDashboardPage() {
  return (
    <AdminLayout>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/admin/users"
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200"
            >
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">User Management</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Manage user accounts, roles, and permissions
                </p>
              </div>
            </Link>

            <Link
              href="/admin/categories"
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200"
            >
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">Service Categories</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Manage service categories and their descriptions
                </p>
              </div>
            </Link>

            <Link
              href="/admin/providers"
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200"
            >
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">Provider Verification</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Review and verify service provider accounts
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 