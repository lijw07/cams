import React, { useState, useEffect, useCallback } from 'react';

import { 
  Plus, 
  Search, 
  Database, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Activity,
  Server,
  X
} from 'lucide-react';

import PerformanceLogsPagination from '../components/logs/PerformanceLogsPagination';
import DatabaseConnectionModal from '../components/modals/DatabaseConnectionModal';
import { useNotifications } from '../contexts/NotificationContext';
import { databaseConnectionService } from '../services/databaseConnectionService';
import { applicationService } from '../services/applicationService';
import { DatabaseConnection, DatabaseType, ConnectionStatus, DatabaseConnectionRequest, DatabaseConnectionUpdateRequest, Application } from '../types';

interface DatabaseConnectionsProps {
  triggerCreateModal?: boolean;
  onModalTriggered?: () => void;
}

const DatabaseConnections: React.FC<DatabaseConnectionsProps> = ({ triggerCreateModal, onModalTriggered }) => {
  const { addNotification } = useNotifications();

  // State
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [sortBy, setSortBy] = useState('Name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<DatabaseConnection | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>('');
  const [selectedApplicationName, setSelectedApplicationName] = useState<string>('');
  const [applications, setApplications] = useState<Application[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [showApplicationSelect, setShowApplicationSelect] = useState(false);

  // Load connections
  const loadConnections = useCallback(async () => {
    try {
      setLoading(true);
      const data = await databaseConnectionService.getConnections();
      setConnections(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading connections:', error);
      addNotification({
        title: 'Loading Error',
        message: 'Failed to load database connections',
        type: 'error',
        source: 'Database Connections',
        details: 'Unable to retrieve database connections. Please check your network connection and try again.',
        suggestions: ['Refresh the page', 'Check your network connection', 'Contact support if the issue persists']
      });
      setConnections([]);
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    loadConnections();
    loadApplications();
  }, [loadConnections]);

  // Handle external trigger to open create modal
  useEffect(() => {
    if (triggerCreateModal) {
      openCreateModal();
      if (onModalTriggered) {
        onModalTriggered();
      }
    }
  }, [triggerCreateModal]);

  // Load applications for the dropdown
  const loadApplications = async () => {
    try {
      setApplicationsLoading(true);
      const response = await applicationService.getApplications();
      
      // Handle different response types
      if (Array.isArray(response)) {
        setApplications(response);
      } else if (response && typeof response === 'object' && 'message' in response) {
        // Backend returned an error object
        console.error('Backend returned error for applications:', response);
        setApplications([]);
        addNotification({
          title: 'Authentication Required',
          message: 'Please log in to access applications',
          type: 'warning',
          source: 'Database Connections',
          details: 'Your session may have expired. Please log in again to access applications.',
          suggestions: [
            'Log in with your credentials',
            'Refresh the page if you are already logged in',
            'Check if your session has expired'
          ]
        });
      } else {
        console.warn('Applications response is not an array:', response);
        setApplications([]);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      setApplications([]); // Ensure we always have an array
      
      // Check if it's an authentication error
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as any).response;
        if (response?.status === 401) {
          addNotification({
            title: 'Authentication Required',
            message: 'Please log in to access applications',
            type: 'warning',
            source: 'Database Connections',
            details: 'Your session has expired. Please log in again to access applications.',
            suggestions: [
              'Log in with your credentials',
              'Refresh the page after logging in'
            ]
          });
        } else {
          addNotification({
            title: 'Error Loading Applications',
            message: 'Failed to load applications for connection creation',
            type: 'error',
            source: 'Database Connections',
            details: 'Unable to retrieve applications. This may affect your ability to create new connections.',
            suggestions: [
              'Refresh the page to try again',
              'Check your network connection',
              'Contact support if the issue persists'
            ]
          });
        }
      } else {
        addNotification({
          title: 'Error Loading Applications',
          message: 'Failed to load applications for connection creation',
          type: 'error',
          source: 'Database Connections',
          details: 'Unable to retrieve applications. This may affect your ability to create new connections.',
          suggestions: [
            'Refresh the page to try again',
            'Check your network connection',
            'Contact support if the issue persists'
          ]
        });
      }
    } finally {
      setApplicationsLoading(false);
    }
  };

  // Filter and sort connections
  const filteredConnections = connections.filter(connection => {
    const matchesSearch = !searchTerm || 
      connection.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      connection.TypeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      connection.ApplicationName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Sort connections
  const sortedConnections = [...filteredConnections].sort((a, b) => {
    let aValue: any = a[sortBy as keyof DatabaseConnection];
    let bValue: any = b[sortBy as keyof DatabaseConnection];
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Pagination
  const totalItems = sortedConnections.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedConnections = sortedConnections.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // Handle search and sorting
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  // Test connection
  const handleTestConnection = async (id: string) => {
    const connection = connections.find(c => c.Id === id);
    try {
      const result = await databaseConnectionService.testExistingConnection(id);
      if (result.IsSuccessful) {
        addNotification({
          title: 'Test Successful',
          message: `Connection test passed for "${connection?.Name || 'connection'}"`,
          type: 'success',
          source: 'Database Connections',
          details: `Successfully connected to the database. Response time: ${result.ResponseTime || 'N/A'}ms`
        });
      } else {
        addNotification({
          title: 'Test Failed',
          message: `Connection test failed for "${connection?.Name || 'connection'}"`,
          type: 'error',
          source: 'Database Connections',
          details: result.Message || 'Unknown connection error occurred',
          suggestions: [
            'Verify server address and credentials',
            'Check if the database server is running',
            'Review firewall and network settings'
          ]
        });
      }
      await loadConnections(); // Refresh to show updated status
    } catch (error) {
      addNotification({
        title: 'Test Error',
        message: `Unable to test connection "${connection?.Name || 'connection'}"`,
        type: 'error',
        source: 'Database Connections',
        details: 'An unexpected error occurred while testing the connection.',
        suggestions: ['Check your network connection', 'Try again in a few moments', 'Verify the connection still exists']
      });
    }
  };

  // Toggle connection status
  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      await databaseConnectionService.toggleConnectionStatus(id, isActive);
      const connection = connections.find(c => c.Id === id);
      addNotification({
        title: 'Status Updated',
        message: `Connection "${connection?.Name || 'connection'}" ${isActive ? 'activated' : 'deactivated'} successfully`,
        type: 'success',
        source: 'Database Connections',
        details: `The connection is now ${isActive ? 'active and available for use' : 'deactivated and will not be used by applications'}.`
      });
      await loadConnections();
    } catch (error) {
      addNotification({
        title: 'Status Update Failed',
        message: 'Failed to update connection status',
        type: 'error',
        source: 'Database Connections',
        details: 'Unable to change the connection status. Please check your permissions and try again.',
        suggestions: ['Verify you have permission to modify connections', 'Check if the connection exists', 'Try refreshing and attempting again']
      });
    }
  };

  // Delete connection
  const handleDeleteConnection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this connection?')) return;

    try {
      await databaseConnectionService.deleteConnection(id);
      const connection = connections.find(c => c.Id === id);
      addNotification({
        title: 'Success',
        message: 'Connection deleted successfully',
        type: 'success',
        source: 'Database Connections'
      });
      await loadConnections();
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to delete connection',
        type: 'error',
        source: 'Database Connections'
      });
    }
  };

  // Modal handlers
  const openCreateModal = () => {
    setSelectedConnection(null);
    
    // Check if applications are still loading
    if (applicationsLoading) {
      addNotification({
        title: 'Loading Applications',
        message: 'Please wait while applications are being loaded...',
        type: 'info',
        source: 'Database Connections',
        details: 'The system is retrieving available applications. Please try again in a moment.',
        suggestions: ['Wait a moment and try again']
      });
      return;
    }
    
    if (applications.length === 0) {
      addNotification({
        title: 'No Applications Available',
        message: 'You need to create an application first before adding database connections',
        type: 'info',
        source: 'Database Connections',
        details: 'Database connections must be associated with an application. Please create an application first.',
        suggestions: [
          'Go to the Applications tab and click "New Application"',
          'Create at least one application to manage connections',
          'Applications help organize your database connections'
        ]
      });
      return;
    }
    setShowApplicationSelect(true);
  };

  const handleApplicationSelect = (applicationId: string) => {
    const app = applications.find(a => a.Id === applicationId);
    if (app) {
      setSelectedApplicationId(app.Id);
      setSelectedApplicationName(app.Name);
      setShowApplicationSelect(false);
      setIsModalOpen(true);
    }
  };

  const openEditModal = (connection: DatabaseConnection) => {
    setSelectedConnection(connection);
    setSelectedApplicationId(connection.ApplicationId || '');
    setSelectedApplicationName(connection.ApplicationName || 'Unknown Application');
    setIsModalOpen(true);
  };

  const handleCreateConnection = async (data: DatabaseConnectionRequest) => {
    try {
      await databaseConnectionService.createConnection(data);
      addNotification({ 
        title: 'Success', 
        message: 'Connection created successfully', 
        type: 'success', 
        source: 'Database Connections' 
      });
      await loadConnections();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error creating connection:', error);
      addNotification({ 
        title: 'Error', 
        message: 'Failed to create connection', 
        type: 'error', 
        source: 'Database Connections' 
      });
      throw error;
    }
  };

  const handleUpdateConnection = async (data: DatabaseConnectionUpdateRequest) => {
    if (!selectedConnection) return;
    
    try {
      await databaseConnectionService.updateConnection(selectedConnection.Id, data);
      addNotification({ 
        title: 'Success', 
        message: 'Connection updated successfully', 
        type: 'success', 
        source: 'Database Connections' 
      });
      await loadConnections();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error updating connection:', error);
      addNotification({ 
        title: 'Error', 
        message: 'Failed to update connection', 
        type: 'error', 
        source: 'Database Connections' 
      });
      throw error;
    }
  };

  // Status icon component
  const StatusIcon: React.FC<{ status: ConnectionStatus }> = ({ status }) => {
    switch (status) {
      case ConnectionStatus.Connected:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case ConnectionStatus.Failed:
        return <XCircle className="w-5 h-5 text-red-500" />;
      case ConnectionStatus.Testing:
        return <Clock className="w-5 h-5 text-yellow-500 animate-spin" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-400" />;
    }
  };

  // Get database type color
  const getTypeColor = (type: DatabaseType): string => {
    switch (type) {
      case DatabaseType.SqlServer:
        return 'bg-blue-100 text-blue-600';
      case DatabaseType.MySQL:
        return 'bg-orange-100 text-orange-600';
      case DatabaseType.PostgreSQL:
        return 'bg-indigo-100 text-indigo-600';
      case DatabaseType.Oracle:
        return 'bg-red-100 text-red-600';
      case DatabaseType.SQLite:
        return 'bg-green-100 text-green-600';
      case DatabaseType.RestApi:
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

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
                placeholder="Search connections..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700 dark:text-gray-300">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => handleSort(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="Name">Name</option>
                <option value="TypeName">Type</option>
                <option value="ApplicationName">Application</option>
                <option value="LastTestedAt">Last Tested</option>
              </select>
              <button
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="px-2 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title={`Sort ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
              >
                {sortDirection === 'asc' ? '↑' : '↓'}
              </button>
            </div>
            
          </div>
        </div>
      </div>


      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading connections...</p>
          </div>
        </div>
      ) : filteredConnections.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-center py-12">
            <Database className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No matching connections' : 'No connections yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {searchTerm 
                ? `No connections found for "${searchTerm}". Try adjusting your search.`
                : 'Create your first database connection to get started.'
              }
            </p>
            {!searchTerm && (
              <button onClick={openCreateModal} className="btn btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Create Connection
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedConnections.map((connection) => (
              <div key={connection.Id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openEditModal(connection)}>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Database className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{connection.Name}</h3>
                        <p className="text-sm text-gray-500">{connection.ApplicationName || 'No Application'}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStatus(connection.Id, !connection.IsActive);
                      }}
                      className="p-1 rounded-md hover:bg-gray-100"
                      title={connection.IsActive ? 'Deactivate' : 'Activate'}
                    >
                      {connection.IsActive ? (
                        <ToggleRight className="w-5 h-5 text-success-600" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>

                  {connection.Description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{connection.Description}</p>
                  )}

                  <div className="flex items-center gap-2 mb-4">
                    <span className={`badge ${getTypeColor(connection.Type)}`}>
                      {connection.TypeName}
                    </span>
                    <div className="flex items-center">
                      <StatusIcon status={connection.Status} />
                      <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">
                        {connection.StatusName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="text-sm text-gray-500">
                      {connection.LastTestedAt ? (
                        <span>Tested: {new Date(connection.LastTestedAt).toLocaleDateString()}</span>
                      ) : (
                        <span>Never tested</span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestConnection(connection.Id);
                        }}
                        className="p-1 rounded-md text-gray-400 hover:text-primary-600 hover:bg-primary-50"
                        title="Test Connection"
                      >
                        <Activity className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(connection);
                        }}
                        className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-700"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConnection(connection.Id);
                        }}
                        className="p-1 rounded-md text-gray-400 hover:text-error-600 hover:bg-error-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalItems > 0 && (
            <PerformanceLogsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[6, 9, 12, 24]}
            />
          )}
        </>
      )}

      {/* Application Selection Dialog */}
      {showApplicationSelect && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setShowApplicationSelect(false)}
            />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Select Application
                </h3>
                <button
                  onClick={() => setShowApplicationSelect(false)}
                  className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Choose an application to add a database connection to:
              </p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Array.isArray(applications) && applications.length > 0 ? (
                  applications.map((app) => (
                    <button
                      key={app.Id}
                      onClick={() => handleApplicationSelect(app.Id)}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{app.Name}</div>
                      {app.Description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                          {app.Description}
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {applicationsLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mr-2"></div>
                        Loading applications...
                      </div>
                    ) : (
                      <div>
                        <p>No applications available</p>
                        <p className="text-sm mt-1">Please create an application first</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Create/Edit */}
      {isModalOpen && selectedApplicationId && (
        <DatabaseConnectionModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedApplicationId('');
            setSelectedApplicationName('');
          }}
          onSubmit={selectedConnection ? handleUpdateConnection : handleCreateConnection}
          applicationId={selectedApplicationId}
          applicationName={selectedApplicationName}
          connection={selectedConnection || undefined}
          mode={selectedConnection ? 'edit' : 'create'}
        />
      )}
    </div>
  );
};

export default DatabaseConnections;