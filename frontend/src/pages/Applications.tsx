import React from 'react';
import { Package, Plus } from 'lucide-react';

const Applications: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-600">Manage your applications and their configurations</p>
        </div>
        <button className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          New Application
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first application to get started with connection management.
          </p>
          <button className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Create Application
          </button>
        </div>
      </div>
    </div>
  );
};

export default Applications;