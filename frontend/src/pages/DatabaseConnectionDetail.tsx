import React from 'react';
import { useParams } from 'react-router-dom';
import { Database } from 'lucide-react';

const DatabaseConnectionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Database className="w-8 h-8 text-gray-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Connection Details</h1>
          <p className="text-gray-600">Connection ID: {id}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Database connection detail page coming soon...</p>
      </div>
    </div>
  );
};

export default DatabaseConnectionDetail;