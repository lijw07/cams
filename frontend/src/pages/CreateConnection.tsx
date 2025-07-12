import React, { useState, useEffect } from 'react';

import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { 
  ArrowLeft, 
  Database, 
  TestTube, 
  Save, 
  Eye, 
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react';

import Button from '../components/common/Button';
// import LoadingSpinner from '../components/common/LoadingSpinner'; // TODO: Use for loading states
import { useNotifications } from '../contexts/NotificationContext';
import { applicationService } from '../services/applicationService';
import { databaseConnectionService } from '../services/databaseConnectionService';
import { 
  DatabaseConnectionRequest, 
  DatabaseType, 
  AuthenticationMethod,
  DatabaseTestRequest,
  DatabaseTestResponse
} from '../types';

interface Application {
  Id: string;
  Name: string;
}

const CreateConnection: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  
  // Form state
  const { register, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm<DatabaseConnectionRequest>({
    mode: 'onSubmit',  // Only validate when form is submitted
    defaultValues: {
      Type: DatabaseType.SqlServer,
      IsActive: true,
      Port: 1433,
      AuthenticationMethod: AuthenticationMethod.BasicAuth
    }
  });

  // Component state
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<DatabaseTestResponse | null>(null);
  const [supportedTypes, setSupportedTypes] = useState<{ [key: number]: string }>({});

  // Only watch the type since it's used for conditional rendering
  const selectedType = watch('Type');

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [appsData, typesData] = await Promise.all([
          applicationService.getApplications(),
          databaseConnectionService.getSupportedDatabaseTypes()
        ]);
        
        setApplications(Array.isArray(appsData) ? appsData : appsData.Items || []);
        setSupportedTypes(typesData.DatabaseTypes?.reduce((acc: any, type: any) => {
          acc[type.Type] = type.Name;
          return acc;
        }, {}) || {});
      } catch (error) {
        console.error('Error loading data:', error);
        addNotification({
          title: 'Loading Error',
          message: 'Failed to load form data',
          type: 'error',
          source: 'Create Connection',
          details: 'Unable to load applications and database types. Please refresh and try again.'
        });
      }
    };

    loadData();
  }, [addNotification]);

  // Update default port when database type changes
  useEffect(() => {
    const defaultPorts: { [key in DatabaseType]?: number } = {
      [DatabaseType.SqlServer]: 1433,
      [DatabaseType.MySQL]: 3306,
      [DatabaseType.PostgreSQL]: 5432,
      [DatabaseType.Oracle]: 1521,
      [DatabaseType.MongoDB]: 27017,
      [DatabaseType.Redis]: 6379,
    };

    const port = defaultPorts[selectedType];
    if (port) {
      setValue('Port', port);
    }
  }, [selectedType, setValue]);

  // Test connection
  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);

      // Show immediate notification that test is starting
      addNotification({
        title: 'Testing Connection',
        message: 'Attempting to connect to the database...',
        type: 'info',
        source: 'Database Connection',
        details: 'This process may take a few seconds depending on your network and database configuration.',
        isPersistent: true
      });

      // Get current form values without causing re-renders
      const formValues = getValues();
      
      const testRequest = {
        ConnectionDetails: {
          ApplicationId: formValues.ApplicationId,
          Name: formValues.Name || 'Test Connection',
          Description: formValues.Description,
          Type: selectedType,
          Server: formValues.Server,
          Port: formValues.Port,
          Database: formValues.Database,
          Username: formValues.Username,
          Password: formValues.Password,
          ConnectionString: formValues.ConnectionString,
          ApiBaseUrl: formValues.ApiBaseUrl,
          ApiKey: formValues.ApiKey,
          AdditionalSettings: formValues.AdditionalSettings,
          IsActive: true
        }
      };

      const result = await databaseConnectionService.testConnection(testRequest);
      setTestResult(result);

      if (result.IsSuccessful) {
        addNotification({
          title: 'Connection Test Successful',
          message: 'Successfully connected to the database',
          type: 'success',
          source: 'Database Connection',
          details: `Connection established in ${result.Duration || 'unknown'} ms. ${result.AdditionalInfo ? JSON.stringify(result.AdditionalInfo) : ''}`,
          suggestions: [
            'You can now save this connection configuration',
            'Consider testing the connection periodically to monitor its status'
          ]
        });
      } else {
        // Extract error code from result
        const errorCode = result.ErrorCode || 'UNKNOWN_ERROR';
        const errorMessage = result.Message || 'Connection failed';
        
        addNotification({
          title: `Connection Test Failed (${errorCode})`,
          message: errorMessage,
          type: 'error',
          source: 'Database Connection',
          details: `The connection test failed with error code: ${errorCode}. Please verify your connection parameters and try again.`,
          technical: `Error Code: ${errorCode}\nError Message: ${errorMessage}\nError Details: ${result.ErrorDetails || 'No additional error details available'}`,
          suggestions: [
            'Verify that the server address and port are correct',
            'Check that the database name exists',
            'Ensure your username and password are valid',
            'Verify that the database server is running and accessible',
            'Check firewall settings that might block the connection'
          ]
        });
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to test connection';
      
      // Try to extract error code from the error response
      let errorCode = 'NETWORK_ERROR';
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as any).response;
        if (response?.data?.ErrorCode) {
          errorCode = response.data.ErrorCode;
        } else if (response?.status) {
          errorCode = `HTTP_${response.status}`;
        }
      }
      
      addNotification({
        title: `Connection Test Failed (${errorCode})`,
        message: 'Network or system error occurred',
        type: 'error',
        source: 'Database Connection',
        details: `The connection test could not be completed due to a system error (${errorCode}).`,
        technical: `Error Code: ${errorCode}\nError: ${errorMessage}\n\nThis could be due to network issues, server problems, or invalid request data.`,
        suggestions: [
          'Check your internet connection',
          'Verify that the CAMS backend server is running',
          'Try again in a few moments',
          'Contact your system administrator if the problem persists'
        ]
      });
      
      setTestResult({
        IsSuccessful: false,
        Message: 'Connection test failed due to network error',
        LastTestedAt: new Date().toISOString()
      });
    } finally {
      setTesting(false);
    }
  };

  // Build connection string
  const handleBuildConnectionString = async () => {
    try {
      // Get current form values without causing re-renders
      const formValues = getValues();
      
      const result = await databaseConnectionService.buildConnectionString({
        DatabaseType: selectedType,
        Server: formValues.Server,
        Database: formValues.Database,
        Username: formValues.Username,
        Password: formValues.Password,
        Port: formValues.Port,
        UseIntegratedSecurity: false,
        ConnectionTimeout: 30,
        CommandTimeout: 30
      });
      
      setValue('ConnectionString', result.ConnectionString);
      addNotification({
        title: 'Connection String Generated',
        message: 'Connection string built successfully',
        type: 'success',
        source: 'Create Connection',
        details: 'Connection string has been automatically generated based on your database configuration.'
      });
    } catch (error) {
      console.error('Error building connection string:', error);
      addNotification({
        title: 'Generation Failed',
        message: 'Failed to generate connection string',
        type: 'error',
        source: 'Create Connection',
        details: 'Unable to build connection string. Please check your database configuration.',
        suggestions: ['Verify all required fields are filled', 'Check server address and port', 'Ensure database name is correct']
      });
    }
  };

  // Submit form
  const onSubmit = async (data: DatabaseConnectionRequest) => {
    try {
      setLoading(true);
      await databaseConnectionService.createConnection(data);
      addNotification({
        title: 'Connection Created',
        message: `Successfully created connection "${data.Name}"`,
        type: 'success',
        source: 'Create Connection',
        details: `Database connection "${data.Name}" has been created and is ready to use.`
      });
      navigate('/database-connections');
    } catch (error) {
      console.error('Error creating connection:', error);
      addNotification({
        title: 'Creation Failed',
        message: `Failed to create connection "${data.Name}"`,
        type: 'error',
        source: 'Create Connection',
        details: 'Unable to create the database connection. Please check your configuration and try again.',
        suggestions: [
          'Verify all required fields are completed',
          'Test the connection before saving',
          'Check server accessibility and credentials',
          'Ensure the connection name is unique'
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if connection uses API
  const isApiConnection = [
    DatabaseType.RestApi, 
    DatabaseType.GraphQL, 
    DatabaseType.WebSocket,
    DatabaseType.Salesforce_API,
    DatabaseType.ServiceNow_API
  ].includes(selectedType);

  // Check if connection uses cloud authentication
  const isCloudConnection = [
    DatabaseType.AWS_RDS,
    DatabaseType.AWS_DynamoDB,
    DatabaseType.AWS_S3,
    DatabaseType.Azure_SQL,
    DatabaseType.Azure_CosmosDB,
    DatabaseType.Azure_Storage,
    DatabaseType.Google_CloudSQL,
    DatabaseType.Google_Firestore,
    DatabaseType.Google_BigQuery
  ].includes(selectedType);
  console.log('Is cloud connection:', isCloudConnection); // TODO: Use for conditional rendering

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Database Connection</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Set up a new database connection for your applications
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Basic Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Connection Name *
                  </label>
                  <input
                    {...register('Name', { required: 'Connection name is required' })}
                    type="text"
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="My Database Connection"
                  />
                  {errors.Name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.Name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Application *
                  </label>
                  <select
                    {...register('ApplicationId', { required: 'Application is required' })}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select an application</option>
                    {applications.map((app) => (
                      <option key={app.Id} value={app.Id}>
                        {app.Name}
                      </option>
                    ))}
                  </select>
                  {errors.ApplicationId && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.ApplicationId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Database Type *
                  </label>
                  <select
                    {...register('Type', { required: 'Database type is required' })}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    {Object.entries(supportedTypes).map(([value, name]) => (
                      <option key={value} value={parseInt(value)}>
                        {name}
                      </option>
                    ))}
                  </select>
                  {errors.Type && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.Type.message}</p>
                  )}
                </div>

                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      {...register('IsActive')}
                      type="checkbox"
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    {...register('Description')}
                    rows={3}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Optional description of this connection"
                  />
                </div>
              </div>
            </div>

            {/* Connection Details */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Connection Details
              </h2>

              {isApiConnection ? (
                /* API Connection Fields */
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      API Base URL *
                    </label>
                    <input
                      {...register('ApiBaseUrl', { required: isApiConnection ? 'API Base URL is required' : false })}
                      type="url"
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="https://api.example.com/v1"
                    />
                    {errors.ApiBaseUrl && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.ApiBaseUrl.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      API Key
                    </label>
                    <div className="relative">
                      <input
                        {...register('ApiKey')}
                        type={showApiKey ? 'text' : 'password'}
                        className="w-full pr-10 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="Enter API key"
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
                </div>
              ) : (
                /* Database Connection Fields */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Server/Host *
                    </label>
                    <input
                      {...register('Server', { required: !isApiConnection ? 'Server is required' : false })}
                      type="text"
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="localhost or server.example.com"
                    />
                    {errors.Server && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.Server.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Port
                    </label>
                    <input
                      {...register('Port', { valueAsNumber: true })}
                      type="number"
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="1433"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Database Name
                    </label>
                    <input
                      {...register('Database')}
                      type="text"
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="database_name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Username
                    </label>
                    <input
                      {...register('Username')}
                      type="text"
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        {...register('Password')}
                        type={showPassword ? 'text' : 'password'}
                        className="w-full pr-10 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Connection String (Optional)
                    </label>
                    <div className="flex space-x-2">
                      <textarea
                        {...register('ConnectionString')}
                        rows={2}
                        className="flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="Custom connection string (optional)"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleBuildConnectionString}
                        disabled={!getValues('Server')}
                      >
                        Generate
                      </Button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Leave empty to auto-generate from the fields above
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Advanced Settings
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Additional Settings (JSON)
                </label>
                <textarea
                  {...register('AdditionalSettings')}
                  rows={4}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder='{"timeout": 30, "retryAttempts": 3}'
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Additional configuration options in JSON format
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Test Connection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <TestTube className="w-5 h-5 mr-2" />
                Test Connection
              </h3>
              
              <Button
                type="button"
                variant="secondary"
                onClick={handleTestConnection}
                disabled={testing || (!getValues('Server') && !getValues('ApiBaseUrl'))}
                className="w-full"
              >
                {testing ? (
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <TestTube className="w-4 h-4 mr-2" />
                )}
                {testing ? 'Testing...' : 'Test Connection'}
              </Button>

              {testResult && (
                <div className={`mt-4 p-3 rounded-md ${testResult.IsSuccessful ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                  <div className="flex items-start">
                    {testResult.IsSuccessful ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
                    )}
                    <div>
                      <p className={`text-sm font-medium ${testResult.IsSuccessful ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                        {testResult.IsSuccessful ? 'Connection Successful' : 'Connection Failed'}
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

            {/* Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="space-y-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {loading ? 'Creating...' : 'Create Connection'}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/database-connections')}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateConnection;