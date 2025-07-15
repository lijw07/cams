import React, { useState, useEffect } from 'react';
import { Github, GitBranch, Plus, ExternalLink, Settings, Trash2, Cloud, Globe, Slack, RefreshCw, Edit } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { externalConnectionService } from '../../services/externalConnectionService';
import { ExternalConnection, ExternalConnectionType, ExternalConnectionStatus } from '../../types/externalConnection';
import ExternalConnectionModal from '../modals/ExternalConnectionModal';

interface ApplicationExternalConnectionsProps {
  applicationId: string;
  applicationName: string;
}

const ApplicationExternalConnections: React.FC<ApplicationExternalConnectionsProps> = ({
  applicationId,
  applicationName
}) => {
  const { addNotification } = useNotifications();
  const [connections, setConnections] = useState<ExternalConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<ExternalConnection | undefined>();
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  useEffect(() => {
    loadConnections();
  }, [applicationId]);

  const loadConnections = async () => {
    setIsLoading(true);
    try {
      const data = await externalConnectionService.getConnectionsByApplicationId(applicationId);
      setConnections(data);
    } catch (error) {
      console.error('Error loading external connections:', error);
      // If the API doesn't exist yet, show empty state
      setConnections([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getConnectionIcon = (type: ExternalConnectionType) => {
    switch (type) {
      case ExternalConnectionType.GitHub:
        return <Github className="h-6 w-6" />;
      case ExternalConnectionType.GitLab:
        return <GitBranch className="h-6 w-6 text-orange-600" />;
      case ExternalConnectionType.Bitbucket:
        return <GitBranch className="h-6 w-6" />;
      case ExternalConnectionType.AzureDevOps:
        return <Cloud className="h-6 w-6 text-blue-600" />;
      case ExternalConnectionType.Slack:
        return <Slack className="h-6 w-6" />;
      case ExternalConnectionType.Teams:
        return <Cloud className="h-6 w-6 text-purple-600" />;
      case ExternalConnectionType.Jenkins:
      case ExternalConnectionType.CircleCI:
      case ExternalConnectionType.TravisCI:
        return <Cloud className="h-6 w-6 text-green-600" />;
      default:
        return <ExternalLink className="h-6 w-6" />;
    }
  };

  const getStatusColor = (status: ExternalConnectionStatus) => {
    switch (status) {
      case ExternalConnectionStatus.Connected:
        return 'text-green-600';
      case ExternalConnectionStatus.Disconnected:
        return 'text-gray-400';
      case ExternalConnectionStatus.Error:
        return 'text-red-600';
      case ExternalConnectionStatus.Pending:
        return 'text-yellow-600';
      default:
        return 'text-gray-400';
    }
  };

  const handleAddConnection = () => {
    setSelectedConnection(undefined);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditConnection = (connection: ExternalConnection) => {
    setSelectedConnection(connection);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteConnection = async (connectionId: string) => {
    if (!confirm('Are you sure you want to remove this external connection?')) {
      return;
    }

    try {
      await externalConnectionService.deleteConnection(connectionId);
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'External connection removed successfully'
      });
      loadConnections();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to remove external connection'
      });
    }
  };

  const handleSyncConnection = async (connectionId: string) => {
    try {
      addNotification({
        type: 'info',
        title: 'Syncing',
        message: 'Synchronizing with external service...'
      });
      
      const result = await externalConnectionService.syncConnection(connectionId);
      
      if (result.Success) {
        addNotification({
          type: 'success',
          title: 'Success',
          message: result.Message || 'Connection synchronized successfully'
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Sync Failed',
          message: result.Message || 'Failed to synchronize connection'
        });
      }
      
      loadConnections();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to synchronize connection'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading external connections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900">External Connections</h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage integrations with external services like GitHub, CI/CD tools, and webhooks
              </p>
            </div>
            <button
              onClick={handleAddConnection}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Connection
            </button>
          </div>
        </div>

        <div className="p-6">
          {connections.length === 0 ? (
            <div className="text-center py-12">
              <ExternalLink className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No external connections</h3>
              <p className="mt-1 text-sm text-gray-500">
                Connect this application to external services like GitHub, CI/CD tools, or webhooks.
              </p>
              <div className="mt-6">
                <button
                  onClick={handleAddConnection}
                  className="btn btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Connection
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {connections.map((connection) => (
                <div
                  key={connection.Id}
                  className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      {getConnectionIcon(connection.Type)}
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-900">
                          {connection.Name}
                        </h3>
                        <p className="text-sm text-gray-500">{connection.Type}</p>
                      </div>
                    </div>
                    <span className={`${getStatusColor(connection.Status)}`}>
                      {connection.Status === ExternalConnectionStatus.Connected ? '●' : '○'}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    {connection.Repository && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Repo:</span> {connection.Repository}
                      </p>
                    )}
                    {connection.Branch && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Branch:</span> {connection.Branch}
                      </p>
                    )}
                    {connection.Url && (
                      <p className="text-sm text-gray-600 truncate">
                        <span className="font-medium">URL:</span> {connection.Url}
                      </p>
                    )}
                    {connection.LastSyncedAt && (
                      <p className="text-sm text-gray-500">
                        Last synced: {new Date(connection.LastSyncedAt).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      connection.IsActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {connection.IsActive ? 'Active' : 'Inactive'}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSyncConnection(connection.Id)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Sync"
                        disabled={!connection.IsActive}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditConnection(connection)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteConnection(connection.Id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ExternalConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        applicationId={applicationId}
        applicationName={applicationName}
        connection={selectedConnection}
        mode={modalMode}
        onSuccess={loadConnections}
      />
    </div>
  );
};

export default ApplicationExternalConnections;