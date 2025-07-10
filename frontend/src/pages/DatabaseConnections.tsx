import React from 'react';
import { Database, Plus } from 'lucide-react';

const DatabaseConnections: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Database Connections</h1>
          <p className="text-gray-600">Manage your database connections and test connectivity</p>
        </div>
        <button className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          New Connection
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <Database className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No connections yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first database connection to start managing your data sources.
          </p>
          <button className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Create Connection
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatabaseConnections;