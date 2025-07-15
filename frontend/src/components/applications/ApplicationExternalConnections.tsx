import React, { useState } from 'react';
import { Github, GitBranch, Plus, ExternalLink, Settings, Trash2 } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';

interface ApplicationExternalConnectionsProps {
  applicationId: string;
  applicationName: string;
}

interface ExternalConnection {
  Id: string;
  Type: 'github' | 'gitlab' | 'bitbucket' | 'azure-devops';
  Name: string;
  IsConnected: boolean;
  Repository?: string;
  Branch?: string;
  LastSyncedAt?: string;
}

const ApplicationExternalConnections: React.FC<ApplicationExternalConnectionsProps> = ({
  applicationId,
  applicationName
}) => {
  const { addNotification } = useNotifications();
  const [connections, setConnections] = useState<ExternalConnection[]>([
    {
      Id: '1',
      Type: 'github',
      Name: 'GitHub Repository',
      IsConnected: true,
      Repository: `organization/${applicationName.toLowerCase().replace(/\s+/g, '-')}`,
      Branch: 'main',
      LastSyncedAt: new Date().toISOString()
    }
  ]);
  const [showAddModal, setShowAddModal] = useState(false);

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'github':
        return <Github className="h-6 w-6" />;
      case 'gitlab':
        return <GitBranch className="h-6 w-6" />;
      default:
        return <ExternalLink className="h-6 w-6" />;
    }
  };

  const handleAddConnection = () => {
    addNotification({
      type: 'info',
      title: 'Coming Soon',
      message: 'Adding new external connections will be available soon'
    });
  };

  const handleConfigureConnection = (connection: ExternalConnection) => {
    addNotification({
      type: 'info',
      title: 'Configure Connection',
      message: `Configuring ${connection.Name} for ${applicationName}`
    });
  };

  const handleRemoveConnection = (connectionId: string) => {
    if (window.confirm('Are you sure you want to remove this connection?')) {
      setConnections(connections.filter(c => c.Id !== connectionId));
      addNotification({
        type: 'success',
        title: 'Connection Removed',
        message: 'External connection has been removed'
      });
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">External Connections</h2>
          <p className="mt-1 text-sm text-gray-500">
            Connect your application to external services like GitHub, GitLab, and more
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
          <ExternalLink className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No external connections</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by connecting your application to an external service
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {connections.map((connection) => (
            <div
              key={connection.Id}
              className="relative bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 text-gray-700">
                    {getConnectionIcon(connection.Type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {connection.Name}
                    </h3>
                    {connection.Repository && (
                      <p className="mt-1 text-sm text-gray-500 truncate">
                        {connection.Repository}
                      </p>
                    )}
                    {connection.Branch && (
                      <p className="text-xs text-gray-500">
                        Branch: {connection.Branch}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleConfigureConnection(connection)}
                    className="p-1 text-gray-400 hover:text-gray-500"
                    title="Configure"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveConnection(connection.Id)}
                    className="p-1 text-gray-400 hover:text-red-500"
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs">
                  <span className={`inline-flex items-center ${
                    connection.IsConnected ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    <span className={`mr-1.5 h-2 w-2 rounded-full ${
                      connection.IsConnected ? 'bg-green-400' : 'bg-gray-400'
                    }`}></span>
                    {connection.IsConnected ? 'Connected' : 'Disconnected'}
                  </span>
                  {connection.LastSyncedAt && (
                    <span className="text-gray-500">
                      Synced {new Date(connection.LastSyncedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApplicationExternalConnections;