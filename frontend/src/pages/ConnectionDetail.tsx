import React, { useState, useEffect } from 'react';

import { useForm } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';

import { 
  ArrowLeft, 
  Database, 
  TestTube, 
  Save, 
  Edit,
  Eye, 
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader,
  Activity,
  Clock,
  Server,
  Shield,
  Settings,
  Trash2
} from 'lucide-react';

import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useNotifications } from '../contexts/NotificationContext';
import { applicationService } from '../services/applicationService';
import { databaseConnectionService } from '../services/databaseConnectionService';
import { 
  DatabaseConnection,
  DatabaseConnectionUpdateRequest, 
  DatabaseType, 
  ConnectionStatus,
  DatabaseTestResponse
} from '../types';

interface Application {
  Id: string;
  Name: string;
}

const ConnectionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  
  // State
  const [connection, setConnection] = useState<DatabaseConnection | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<DatabaseTestResponse | null>(null);
  const [supportedTypes, setSupportedTypes] = useState<{ [key: number]: string }>({});

  // Form
  const { register, handleSubmit, setValue, watch, formState: { errors, isDirty } } = useForm<DatabaseConnectionUpdateRequest>();

  // Watch form values
  const selectedType = watch('Type');
  console.log('Selected type:', selectedType); // TODO: Use selectedType for conditional rendering

  // Load connection data
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const [connectionData, appsData, typesData] = await Promise.all([
          databaseConnectionService.getConnection(id),
          applicationService.getApplications(),
          databaseConnectionService.getSupportedDatabaseTypes()
        ]);

        setConnection(connectionData);
        setApplications(Array.isArray(appsData) ? appsData : appsData.Items || []);
        setSupportedTypes(typesData.DatabaseTypes?.reduce((acc: any, type: any) => {
          acc[type.Type] = type.Name;
          return acc;
        }, {}) || {});

        // Populate form with connection data
        Object.entries(connectionData).forEach(([key, value]) => {
          setValue(key as keyof DatabaseConnectionUpdateRequest, value);
        });
        setValue('Id', connectionData.Id);
      } catch (error) {
        console.error('Error loading connection:', error);
        addNotification({
          title: 'Error',
          message: 'Failed to load connection details',
          type: 'error',
          source: 'Connection Detail',
          details: 'Unable to retrieve connection information. Please check if the connection exists and try again.'
        });
        navigate('/database-connections');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, addNotification, navigate, setValue]);

  // Test connection
  const handleTestConnection = async () => {
    if (!id) return;

    try {
      setTesting(true);
      setTestResult(null);
      const result = await databaseConnectionService.testExistingConnection(id);
      setTestResult(result);

      if (result.IsSuccessful) {
        addNotification({
          title: 'Connection Test Successful',
          message: `Successfully connected to ${connection?.Name || 'database'}`,
          type: 'success',
          source: 'Connection Detail',
          details: `Connection established to ${supportedTypes[connection?.Type || 0] || 'database'} at ${connection?.Server}. Response time: ${result.ResponseTime || 'N/A'}ms`
        });
      } else {
        addNotification({
          title: 'Connection Test Failed',
          message: `Failed to connect to ${connection?.Name || 'database'}`,
          type: 'error',
          source: 'Connection Detail',
          details: result.Message || 'Unknown connection error occurred',
          suggestions: [
            'Verify server address and port are correct',
            'Check username and password credentials',
            'Ensure database server is running and accessible',
            'Verify network connectivity and firewall settings'
          ]
        });
      }

      // Refresh connection data to get updated status
      const updatedConnection = await databaseConnectionService.getConnection(id);
      setConnection(updatedConnection);
    } catch (error) {
      console.error('Error testing connection:', error);
      addNotification({
        title: 'Test Connection Error',
        message: 'Unable to test database connection',
        type: 'error',
        source: 'Connection Detail',
        details: 'An unexpected error occurred while testing the connection. Please try again.',
        suggestions: ['Check your network connection', 'Verify the connection is still valid', 'Try refreshing the page']
      });
    } finally {
      setTesting(false);
    }
  };

  // Save changes
  const onSubmit = async (data: DatabaseConnectionUpdateRequest) => {
    if (!id) return;

    try {
      setSaving(true);
      const updatedConnection = await databaseConnectionService.updateConnection(id, data);
      setConnection(updatedConnection);
      setIsEditing(false);
      addNotification({
        title: 'Connection Updated',
        message: `Successfully updated ${connection?.Name || 'database connection'}`,
        type: 'success',
        source: 'Connection Detail',
        details: `Connection "${data.Name}" has been updated with the latest configuration changes.`
      });
    } catch (error) {
      console.error('Error updating connection:', error);
      addNotification({
        title: 'Update Failed',
        message: `Failed to update ${connection?.Name || 'database connection'}`,
        type: 'error',
        source: 'Connection Detail',
        details: 'Unable to save connection changes. Please verify your input and try again.',
        suggestions: [
          'Check that all required fields are filled correctly',
          'Verify server address and credentials are valid',
          'Ensure you have permission to modify this connection'
        ]
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete connection
  const handleDelete = async () => {
    if (!id || !connection) return;
    
    if (!confirm(`Are you sure you want to delete the connection "${connection.Name}"?`)) {
      return;
    }

    try {
      await databaseConnectionService.deleteConnection(id);
      addNotification({
        title: 'Connection Deleted',
        message: `Successfully deleted connection "${connection.Name}"`,
        type: 'success',
        source: 'Connection Detail',
        details: `Database connection "${connection.Name}" has been permanently removed from the system.`
      });
      navigate('/database-connections');
    } catch (error) {
      console.error('Error deleting connection:', error);
      addNotification({
        title: 'Delete Failed',
        message: `Failed to delete connection "${connection.Name}"`,
        type: 'error',
        source: 'Connection Detail',
        details: 'Unable to delete the connection. It may be in use by applications or you may not have sufficient permissions.',
        suggestions: [
          'Check if the connection is being used by any applications',
          'Verify you have permission to delete this connection',
          'Try again in a few moments'
        ]
      });
    }
  };

  // Toggle connection status
  const handleToggleStatus = async () => {
    if (!id || !connection) return;

    try {
      await databaseConnectionService.toggleConnectionStatus(id, !connection.IsActive);
      const updatedConnection = await databaseConnectionService.getConnection(id);
      setConnection(updatedConnection);
      addNotification({
        title: 'Status Updated',
        message: `Connection "${connection.Name}" ${!connection.IsActive ? 'activated' : 'deactivated'} successfully`,
        type: 'success',
        source: 'Connection Detail',
        details: `The connection is now ${!connection.IsActive ? 'active and available for use' : 'deactivated and will not be used by applications'}.`
      });
    } catch (error) {
      addNotification({
        title: 'Status Update Failed',
        message: `Failed to ${!connection.IsActive ? 'activate' : 'deactivate'} connection "${connection.Name}"`,
        type: 'error',
        source: 'Connection Detail',
        details: 'Unable to change the connection status. Please check your permissions and try again.',
        suggestions: [
          'Verify you have permission to modify this connection',
          'Check if the connection is currently in use',
          'Try refreshing the page and attempting again'
        ]
      });
    }
  };

  // Status icon component
  const StatusIcon: React.FC<{ status: ConnectionStatus; className?: string }> = ({ status, className = "w-5 h-5" }) => {
    switch (status) {
      case ConnectionStatus.Connected:
        return <CheckCircle className={`${className} text-green-500`} />;
      case ConnectionStatus.Failed:
        return <AlertCircle className={`${className} text-red-500`} />;
      case ConnectionStatus.Testing:
        return <Clock className={`${className} text-yellow-500 animate-spin`} />;
      default:
        return <AlertCircle className={`${className} text-gray-400`} />;
    }
  };

  // Check if connection uses API
  const isApiConnection = connection && [
    DatabaseType.RestApi, 
    DatabaseType.GraphQL, 
    DatabaseType.WebSocket,
    DatabaseType.Salesforce_API,
    DatabaseType.ServiceNow_API
  ].includes(connection.Type);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!connection) {
    return (
      <div className="text-center py-12">
        <Database className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Connection not found</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          The requested database connection could not be found.
        </p>
        <div className="mt-6">
          <Button onClick={() => navigate('/database-connections')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Connections
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/database-connections')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Connections
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Database className="w-6 h-6 mr-3" />
              {connection.Name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {connection.TypeName} connection for {connection.ApplicationName}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={handleTestConnection}
            disabled={testing}
          >
            {testing ? (
              <Loader className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <TestTube className="w-4 h-4 mr-2" />
            )}
            {testing ? 'Testing...' : 'Test Connection'}
          </Button>
          
          {!isEditing ? (
            <Button
              variant="secondary"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsEditing(false);
                  // Reset form values
                  Object.entries(connection).forEach(([key, value]) => {
                    setValue(key as keyof DatabaseConnectionUpdateRequest, value);
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit(onSubmit)}
                disabled={saving || !isDirty}
              >
                {saving ? (
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Connection Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Connection Status
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3">
                <StatusIcon status={connection.Status} />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Status</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{connection.StatusName}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className={`w-5 h-5 rounded-full ${connection.IsActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Active</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {connection.IsActive ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Last Tested</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {connection.LastTestedAt 
                    ? new Date(connection.LastTestedAt).toLocaleString()
                    : 'Never'
                  }
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Created</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(connection.CreatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {testResult && (
              <div className={`mt-4 p-4 rounded-md ${testResult.IsSuccessful ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                <div className="flex items-start">
                  {testResult.IsSuccessful ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${testResult.IsSuccessful ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                      {testResult.IsSuccessful ? 'Connection Test Successful' : 'Connection Test Failed'}
                    </p>
                    <p className={`text-sm ${testResult.IsSuccessful ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                      {testResult.Message}
                    </p>
                    {testResult.Duration && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Response time: {testResult.Duration}ms
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Connection Details */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Server className="w-5 h-5 mr-2" />
                Connection Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Connection Name
                  </label>
                  <input
                    {...register('Name', { required: 'Connection name is required' })}
                    type="text"
                    disabled={!isEditing}
                    className={`w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${!isEditing ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                  />
                  {errors.Name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.Name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Application
                  </label>
                  <select
                    {...register('ApplicationId', { required: 'Application is required' })}
                    disabled={!isEditing}
                    className={`w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${!isEditing ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                  >
                    {applications.map((app) => (
                      <option key={app.Id} value={app.Id}>
                        {app.Name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Database Type
                  </label>
                  <select
                    {...register('Type', { required: 'Database type is required' })}
                    disabled={!isEditing}
                    className={`w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${!isEditing ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                  >
                    {Object.entries(supportedTypes).map(([value, name]) => (
                      <option key={value} value={parseInt(value)}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center">
                    <input
                      {...register('IsActive')}
                      type="checkbox"
                      disabled={!isEditing}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
                  </label>
                </div>

                {isApiConnection ? (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      API Base URL
                    </label>
                    <input
                      {...register('ApiBaseUrl')}
                      type="url"
                      disabled={!isEditing}
                      className={`w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${!isEditing ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Server/Host
                      </label>
                      <input
                        {...register('Server')}
                        type="text"
                        disabled={!isEditing}
                        className={`w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${!isEditing ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Port
                      </label>
                      <input
                        {...register('Port', { valueAsNumber: true })}
                        type="number"
                        disabled={!isEditing}
                        className={`w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${!isEditing ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Database Name
                      </label>
                      <input
                        {...register('Database')}
                        type="text"
                        disabled={!isEditing}
                        className={`w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${!isEditing ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Username
                      </label>
                      <input
                        {...register('Username')}
                        type="text"
                        disabled={!isEditing}
                        className={`w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${!isEditing ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                      />
                    </div>
                  </>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    {...register('Description')}
                    rows={3}
                    disabled={!isEditing}
                    className={`w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${!isEditing ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                  />
                </div>
              </div>
            </div>

            {/* Sensitive Information */}
            {isEditing && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Security Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isApiConnection ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        API Key
                      </label>
                      <div className="relative">
                        <input
                          {...register('ApiKey')}
                          type={showApiKey ? 'text' : 'password'}
                          placeholder="Enter new API key to update"
                          className="w-full pr-10 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          {...register('Password')}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter new password to update"
                          className="w-full pr-10 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Leave empty to keep current password
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Connection String
                    </label>
                    <textarea
                      {...register('ConnectionString')}
                      rows={2}
                      placeholder="Custom connection string (optional)"
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            
            <div className="space-y-3">
              <Button
                variant="secondary"
                onClick={handleToggleStatus}
                className="w-full"
              >
                {connection.IsActive ? 'Deactivate' : 'Activate'} Connection
              </Button>

              <Button
                variant="secondary"
                onClick={() => navigate(`/connection-test-demo?connectionId=${connection.Id}`)}
                className="w-full"
              >
                <TestTube className="w-4 h-4 mr-2" />
                Connection Test Demo
              </Button>
              
              <Button
                variant="danger"
                onClick={handleDelete}
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Connection
              </Button>
            </div>
          </div>

          {/* Connection Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Additional Information
            </h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Connection ID</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono break-all">
                  {connection.Id}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Created At</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(connection.CreatedAt).toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Updated</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(connection.UpdatedAt).toLocaleString()}
                </p>
              </div>

              {connection.LastTestResult && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Test Result</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {connection.LastTestResult}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionDetail;