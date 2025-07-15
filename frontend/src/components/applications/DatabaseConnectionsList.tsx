import React, { useState, useEffect } from 'react';
import { Database, Plus, Settings, Trash2 } from 'lucide-react';
import { databaseConnectionService } from '../../services/databaseConnectionService';
import { DatabaseConnection } from '../../types/database';
import { useNotifications } from '../../contexts/NotificationContext';
import LoadingSpinner from '../common/LoadingSpinner';

interface DatabaseConnectionsListProps {
  applicationId: string;
}

const DatabaseConnectionsList: React.FC<DatabaseConnectionsListProps> = ({ applicationId }) => {
  const { addNotification } = useNotifications();
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnections();
  }, [applicationId]);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const data = await databaseConnectionService.getConnections(applicationId);
      setConnections(data);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load database connections'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddConnection = () => {
    // Navigate to add connection page or open modal
    addNotification({
      type: 'info',
      title: 'Add Connection',
      message: 'Navigate to add database connection'
    });
  };

  const handleEditConnection = (connectionId: string) => {
    addNotification({
      type: 'info',
      title: 'Edit Connection',
      message: `Edit connection ${connectionId}`
    });
  };

  const handleDeleteConnection = async (connectionId: string) => {
    if (!window.confirm('Are you sure you want to delete this connection?')) {
      return;
    }

    try {
      await databaseConnectionService.deleteDatabaseConnection(connectionId);
      setConnections(connections.filter(c => c.Id !== connectionId));
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Database connection deleted successfully'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete database connection'
      });
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Database Connections</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage database connections for this application
          </p>
        </div>
        <button
          onClick={handleAddConnection}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Connection
        </button>
      </div>

      {connections.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Database className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No database connections</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding a database connection to your application
          </p>
          <div className="mt-6">
            <button
              onClick={handleAddConnection}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Connection
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {connections.map((connection) => (
              <li key={connection.Id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Database className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {connection.Name}
                        </div>
                        <div className="text-sm text-gray-500">
                          Type {connection.DatabaseType} • {connection.Server || connection.ApiBaseUrl || 'No server'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        connection.IsActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {connection.IsActive ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => handleEditConnection(connection.Id)}
                        className="p-1 text-gray-400 hover:text-gray-500"
                        title="Edit"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteConnection(connection.Id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DatabaseConnectionsList;