import React, { useState, useEffect } from 'react';
import { Github, Cloud, Globe, ExternalLink, Search, RefreshCw, Edit, Trash2, Plus, GitBranch, Slack } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { externalConnectionService } from '../services/externalConnectionService';
import { ExternalConnection, ExternalConnectionType, ExternalConnectionStatus } from '../types/externalConnection';
import ExternalConnectionModal from '../components/modals/ExternalConnectionModal';
import PerformanceLogsPagination from '../components/logs/PerformanceLogsPagination';
import { Link } from 'react-router-dom';

const ExternalConnections: React.FC = () => {
  const { addNotification } = useNotifications();
  const [connections, setConnections] = useState<ExternalConnection[]>([]);
  const [allConnections, setAllConnections] = useState<ExternalConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<ExternalConnection | undefined>();
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  useEffect(() => {
    loadConnections();
  }, []);

  useEffect(() => {
    filterAndPaginateConnections();
  }, [allConnections, searchTerm, currentPage, pageSize]);

  const loadConnections = async () => {
    setIsLoading(true);
    try {
      const data = await externalConnectionService.getConnections();
      setAllConnections(data);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load external connections'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndPaginateConnections = () => {
    let filtered = allConnections;
    if (searchTerm) {
      filtered = allConnections.filter(conn => 
        conn.ApplicationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conn.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conn.Repository?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conn.Type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const startIndex = (currentPage - 1) * pageSize;
    const paginatedConnections = filtered.slice(startIndex, startIndex + pageSize);
    
    setConnections(paginatedConnections);
  };

  const getConnectionIcon = (type: ExternalConnectionType) => {
    switch (type) {
      case ExternalConnectionType.GitHub:
        return <Github className="h-5 w-5" />;
      case ExternalConnectionType.GitLab:
        return <GitBranch className="h-5 w-5 text-orange-600" />;
      case ExternalConnectionType.Bitbucket:
        return <GitBranch className="h-5 w-5" />;
      case ExternalConnectionType.AzureDevOps:
        return <Cloud className="h-5 w-5 text-blue-600" />;
      case ExternalConnectionType.Slack:
        return <Slack className="h-5 w-5" />;
      case ExternalConnectionType.Teams:
        return <Cloud className="h-5 w-5 text-purple-600" />;
      case ExternalConnectionType.Jenkins:
      case ExternalConnectionType.CircleCI:
      case ExternalConnectionType.TravisCI:
        return <Cloud className="h-5 w-5 text-green-600" />;
      default:
        return <ExternalLink className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: ExternalConnectionStatus) => {
    switch (status) {
      case ExternalConnectionStatus.Connected:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case ExternalConnectionStatus.Disconnected:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case ExternalConnectionStatus.Error:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case ExternalConnectionStatus.Pending:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const handleSync = async (connectionId: string) => {
    try {
      addNotification({
        type: 'info',
        title: 'Syncing',
        message: 'Synchronizing external connection...'
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

  const handleToggleStatus = async (connectionId: string, currentStatus: boolean) => {
    try {
      await externalConnectionService.toggleConnectionStatus(connectionId, !currentStatus);
      addNotification({
        type: 'success',
        title: 'Success',
        message: `Connection ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      });
      loadConnections();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update connection status'
      });
    }
  };

  const handleDelete = async (connectionId: string) => {
    if (!confirm('Are you sure you want to delete this external connection?')) {
      return;
    }

    try {
      await externalConnectionService.deleteConnection(connectionId);
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'External connection deleted successfully'
      });
      loadConnections();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete external connection'
      });
    }
  };

  const handleCreate = () => {
    setSelectedConnection(undefined);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEdit = (connection: ExternalConnection) => {
    setSelectedConnection(connection);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const totalCount = searchTerm 
    ? allConnections.filter(conn => 
        conn.ApplicationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conn.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conn.Repository?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conn.Type.toLowerCase().includes(searchTerm.toLowerCase())
      ).length
    : allConnections.length;
    
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {/* Search and Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by application, name, or type..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => loadConnections()}
              className="btn btn-secondary"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={handleCreate}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Connection
            </button>
          </div>
        </div>
      </div>

      {/* Connections List */}
      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading external connections...</p>
          </div>
        </div>
      ) : connections.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-center py-12">
            <ExternalLink className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No matching connections' : 'No external connections'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {searchTerm 
                ? `No external connections found for "${searchTerm}".`
                : 'Connect your applications to external services like GitHub, CI/CD tools, and more.'
              }
            </p>
            {!searchTerm && (
              <button onClick={handleCreate} className="btn btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Connection
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Connection
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Application
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Synced
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {connections.map((connection) => (
                <tr key={connection.Id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {getConnectionIcon(connection.Type)}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {connection.Name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {connection.Type}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      to={`/applications/${connection.ApplicationId}`}
                      className="text-sm text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      {connection.ApplicationName || 'Unknown Application'}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {connection.Repository || connection.Url || connection.WebhookUrl || 'Not configured'}
                    </div>
                    {connection.Branch && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Branch: {connection.Branch}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        connection.IsActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {connection.IsActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getStatusColor(connection.Status)
                      }`}>
                        {connection.Status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {connection.LastSyncedAt 
                      ? new Date(connection.LastSyncedAt).toLocaleString()
                      : 'Never synced'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleSync(connection.Id)}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                        title="Sync Connection"
                        disabled={!connection.IsActive}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(connection.Id, connection.IsActive)}
                        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                        title={connection.IsActive ? 'Deactivate' : 'Activate'}
                      >
                        {connection.IsActive ? '🟢' : '⚪'}
                      </button>
                      <button
                        onClick={() => handleEdit(connection)}
                        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(connection.Id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalCount > 0 && (
        <PerformanceLogsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          pageSizeOptions={[10, 20, 50, 100]}
        />
      )}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExternalLink className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              About External Connections
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <p>
                External connections link your applications to services like GitHub, GitLab, CI/CD tools, 
                and communication platforms. These are separate from database connections and are used for 
                integrations, webhooks, and external API interactions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <ExternalConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        connection={selectedConnection}
        mode={modalMode}
        onSuccess={loadConnections}
      />
    </div>
  );
};

export default ExternalConnections;