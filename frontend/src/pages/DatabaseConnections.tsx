import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  Database, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Edit,
  Trash2,
  Play,
  Pause,
  Eye,
  Activity
} from 'lucide-react';

import { DatabaseConnection, DatabaseType, ConnectionStatus } from '../types';
import { databaseConnectionService } from '../services/databaseConnectionService';
import { useNotifications } from '../contexts/NotificationContext';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Pagination from '../components/common/Pagination';

const DatabaseConnections: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  // State
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<DatabaseType | ''>('');
  const [statusFilter, setStatusFilter] = useState<ConnectionStatus | ''>('');
  const [selectedConnections, setSelectedConnections] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // Load connections
  const loadConnections = useCallback(async () => {
    try {
      setLoading(true);
      const data = await databaseConnectionService.getConnections();
      setConnections(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading connections:', error);
      addNotification('Failed to load database connections', 'error');
      setConnections([]);
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  // Filter connections based on search and filters
  const filteredConnections = connections.filter(connection => {
    const matchesSearch = !searchTerm || 
      connection.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      connection.TypeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      connection.ApplicationName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !typeFilter || connection.Type === typeFilter;
    const matchesStatus = !statusFilter || connection.Status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Pagination
  const paginatedConnections = filteredConnections.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    const total = Math.ceil(filteredConnections.length / pageSize);
    setTotalPages(total);
    setTotalItems(filteredConnections.length);
    if (currentPage > total && total > 0) {
      setCurrentPage(1);
    }
  }, [filteredConnections.length, pageSize, currentPage]);

  // Handle selection
  const handleSelectConnection = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedConnections(prev => [...prev, id]);
    } else {
      setSelectedConnections(prev => prev.filter(cId => cId !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedConnections(paginatedConnections.map(c => c.Id));
    } else {
      setSelectedConnections([]);
    }
  };

  // Test connection
  const handleTestConnection = async (id: string) => {
    try {
      const result = await databaseConnectionService.testExistingConnection(id);
      if (result.IsSuccessful) {
        addNotification('Connection test successful', 'success');
      } else {
        addNotification(`Connection test failed: ${result.Message}`, 'error');
      }
      await loadConnections(); // Refresh to show updated status
    } catch (error) {
      addNotification('Failed to test connection', 'error');
    }
  };

  // Toggle connection status
  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      await databaseConnectionService.toggleConnectionStatus(id, isActive);
      addNotification(`Connection ${isActive ? 'activated' : 'deactivated'} successfully`, 'success');
      await loadConnections();
    } catch (error) {
      addNotification('Failed to update connection status', 'error');
    }
  };

  // Delete connection
  const handleDeleteConnection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this connection?')) return;

    try {
      await databaseConnectionService.deleteConnection(id);
      addNotification('Connection deleted successfully', 'success');
      await loadConnections();
    } catch (error) {
      addNotification('Failed to delete connection', 'error');
    }
  };

  // Bulk operations
  const handleBulkToggleStatus = async (isActive: boolean) => {
    if (selectedConnections.length === 0) return;

    try {
      await databaseConnectionService.bulkToggleStatus(selectedConnections, isActive);
      addNotification(`${selectedConnections.length} connections ${isActive ? 'activated' : 'deactivated'}`, 'success');
      setSelectedConnections([]);
      await loadConnections();
    } catch (error) {
      addNotification('Failed to update connection statuses', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedConnections.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedConnections.length} connections?`)) return;

    try {
      await databaseConnectionService.bulkDelete(selectedConnections);
      addNotification(`${selectedConnections.length} connections deleted`, 'success');
      setSelectedConnections([]);
      await loadConnections();
    } catch (error) {
      addNotification('Failed to delete connections', 'error');
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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Database Connections</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage database connections for your applications
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            onClick={loadConnections}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => navigate('/database-connections/create')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Connection
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search connections..."
                className="pl-10 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Database Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as DatabaseType | '')}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Types</option>
              <option value={DatabaseType.SqlServer}>SQL Server</option>
              <option value={DatabaseType.MySQL}>MySQL</option>
              <option value={DatabaseType.PostgreSQL}>PostgreSQL</option>
              <option value={DatabaseType.Oracle}>Oracle</option>
              <option value={DatabaseType.SQLite}>SQLite</option>
              <option value={DatabaseType.RestApi}>REST API</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ConnectionStatus | '')}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value={ConnectionStatus.Connected}>Connected</option>
              <option value={ConnectionStatus.Failed}>Failed</option>
              <option value={ConnectionStatus.Untested}>Untested</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              variant="secondary"
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('');
                setStatusFilter('');
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedConnections.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700 dark:text-blue-300">
              {selectedConnections.length} connection(s) selected
            </span>
            <div className="flex space-x-2">
              <Button size="sm" variant="secondary" onClick={() => handleBulkToggleStatus(true)}>
                <Play className="w-4 h-4 mr-1" />
                Activate
              </Button>
              <Button size="sm" variant="secondary" onClick={() => handleBulkToggleStatus(false)}>
                <Pause className="w-4 h-4 mr-1" />
                Deactivate
              </Button>
              <Button size="sm" variant="danger" onClick={handleBulkDelete}>
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Connections Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={paginatedConnections.length > 0 && selectedConnections.length === paginatedConnections.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Connection
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Application
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Last Tested
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedConnections.map((connection) => (
                <tr key={connection.Id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedConnections.includes(connection.Id)}
                      onChange={(e) => handleSelectConnection(connection.Id, e.target.checked)}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Database className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {connection.Name}
                        </div>
                        {connection.Description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {connection.Description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                      {connection.TypeName}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {connection.ApplicationName}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <StatusIcon status={connection.Status} />
                      <span className="ml-2 text-sm text-gray-900 dark:text-white">
                        {connection.StatusName}
                      </span>
                      {!connection.IsActive && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                          Inactive
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {connection.LastTestedAt ? new Date(connection.LastTestedAt).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigate(`/database-connections/${connection.Id}`)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/database-connections/${connection.Id}/edit`)}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleTestConnection(connection.Id)}
                        className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-200"
                        title="Test Connection"
                      >
                        <Activity className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(connection.Id, !connection.IsActive)}
                        className={`${connection.IsActive ? 'text-yellow-600 hover:text-yellow-900 dark:text-yellow-400' : 'text-green-600 hover:text-green-900 dark:text-green-400'}`}
                        title={connection.IsActive ? 'Deactivate' : 'Activate'}
                      >
                        {connection.IsActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteConnection(connection.Id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
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

        {filteredConnections.length === 0 && (
          <div className="text-center py-12">
            <Database className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No connections found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {connections.length === 0 
                ? "Get started by creating your first database connection."
                : "Try adjusting your search criteria or filters."
              }
            </p>
            {connections.length === 0 && (
              <div className="mt-6">
                <Button onClick={() => navigate('/database-connections/create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Connection
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
};

export default DatabaseConnections;