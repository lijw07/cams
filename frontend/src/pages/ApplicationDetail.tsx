import React from 'react';

import { useParams } from 'react-router-dom';

import { Package } from 'lucide-react';

const ApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Package className="w-8 h-8 text-gray-600 dark:text-gray-400" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Application Details</h1>
          <p className="text-gray-600 dark:text-gray-300">Application ID: {id}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-600 dark:text-gray-300">Application detail page coming soon...</p>
      </div>
    </div>
  );
};

export default ApplicationDetail;