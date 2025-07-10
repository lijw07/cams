import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { X, Database, Server, Key, Zap } from 'lucide-react';
import { ApplicationWithConnectionRequest, DatabaseType } from '../../types';
import { databaseConnectionService } from '../../services/databaseConnectionService';
import { useNotifications } from '../contexts/NotificationContext';

interface ApplicationWithConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ApplicationWithConnectionRequest) => Promise<void>;
}

const ApplicationWithConnectionModal: React.FC<ApplicationWithConnectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDbType, setSelectedDbType] = useState<DatabaseType>(DatabaseType.SqlServer);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    clearErrors,
    trigger,
    formState: { errors, isSubmitting }
  } = useForm<ApplicationWithConnectionRequest>({
    defaultValues: {
      applicationName: '',
      applicationDescription: '',
      version: '',
      environment: 'Development',
      tags: '',
      isApplicationActive: true,
      connectionName: '',
      connectionDescription: '',
      databaseType: DatabaseType.SqlServer,
      server: '',
      port: undefined,
      database: '',
      username: '',
      password: '',
      connectionString: '',
      apiBaseUrl: '',
      apiKey: '',
      additionalSettings: '',
      isConnectionActive: true,
      testConnectionOnCreate: false
    }
  });

  const watchedDbType = watch('databaseType');

  useEffect(() => {
    setSelectedDbType(watchedDbType);
    setTestResult(null); // Clear test result when database type changes
  }, [watchedDbType]);

  // Clear test result when connection form data changes
  useEffect(() => {
    if (currentStep === 2) {
      setTestResult(null);
    }
  }, [watch('server'), watch('port'), watch('database'), watch('username'), watch('password'), watch('connectionString'), watch('apiBaseUrl'), currentStep]);

  // Clear errors when modal opens
  useEffect(() => {
    if (isOpen) {
      clearErrors();
      setCurrentStep(1);
      setTestResult(null);
    }
  }, [isOpen, clearErrors]);

  const handleFormSubmit = async (data: ApplicationWithConnectionRequest) => {
    try {
      // Convert port from string to number if provided
      const submissionData = {
        ...data,
        port: data.port ? parseInt(data.port.toString()) : undefined
      };
      
      console.log('Form submission data before sending:', submissionData);
      console.log('Required fields check:', {
        applicationName: submissionData.applicationName,
        connectionName: submissionData.connectionName,
        databaseType: submissionData.databaseType,
        server: submissionData.server
      });
      
      await onSubmit(submissionData);
      reset();
      setCurrentStep(1);
      onClose();
    } catch (error) {
      console.error('Error submitting application with connection:', error);
    }
  };

  const handleClose = () => {
    reset();
    setCurrentStep(1);
    setTestResult(null);
    clearErrors();
    onClose();
  };

  const nextStep = async () => {
    // Validate step 1 fields before proceeding
    const isStep1Valid = await trigger(['applicationName']);
    
    if (isStep1Valid) {
      setCurrentStep(2);
      setTestResult(null);
      // Only clear errors for step 2 fields, keep step 1 validation
      clearErrors(['connectionName', 'databaseType', 'server', 'database', 'username', 'password', 'connectionString', 'apiBaseUrl']);
    }
  };

  const prevStep = () => {
    setCurrentStep(1);
    setTestResult(null);
    // Clear only step 2 validation errors when going back to step 1
    clearErrors(['connectionName', 'databaseType', 'server', 'database', 'username', 'password', 'connectionString', 'apiBaseUrl']);
  };

  const handleTestConnection = async () => {
    const formData = watch();
    setIsTestingConnection(true);
    setTestResult(null);

    try {
      // Build test data based on connection type
      let testData;
      
      if (isConnectionStringType()) {
        // For custom connection string types, we need a different approach
        toast.error('Connection testing not available for custom connection strings');
        setIsTestingConnection(false);
        return;
      } else if (isApiType()) {
        // For API types, we could test the base URL
        toast.error('Connection testing not available for API endpoints');
        setIsTestingConnection(false);
        return;
      } else {
        // For database connections
        testData = {
          databaseType: formData.databaseType,
          server: formData.server || '',
          database: formData.database || '',
          username: formData.username || '',
          password: formData.password || '',
          port: formData.port
        };
      }

      const result = await databaseConnectionService.testConnection(testData);
      
      if (result.isSuccessful) {
        setTestResult({ success: true, message: result.message || 'Connection successful!' });
        toast.success('Database connection test passed!');
      } else {
        setTestResult({ success: false, message: result.message || 'Connection failed' });
        toast.error(`Connection test failed: ${result.message}`);
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Connection test failed';
      setTestResult({ success: false, message: errorMessage });
      toast.error(`Connection test failed: ${errorMessage}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const getDatabaseTypeOptions = () => [
    { value: DatabaseType.SqlServer, label: 'SQL Server' },
    { value: DatabaseType.MySQL, label: 'MySQL' },
    { value: DatabaseType.PostgreSQL, label: 'PostgreSQL' },
    { value: DatabaseType.Oracle, label: 'Oracle' },
    { value: DatabaseType.SQLite, label: 'SQLite' },
    { value: DatabaseType.MongoDB, label: 'MongoDB' },
    { value: DatabaseType.Redis, label: 'Redis' },
    { value: DatabaseType.RestApi, label: 'REST API' },
    { value: DatabaseType.GraphQL, label: 'GraphQL' },
    { value: DatabaseType.WebSocket, label: 'WebSocket' },
    { value: DatabaseType.Custom, label: 'Custom' }
  ];

  const isApiType = () => {
    return [DatabaseType.RestApi, DatabaseType.GraphQL, DatabaseType.WebSocket].includes(selectedDbType);
  };

  const isConnectionStringType = () => {
    return [DatabaseType.Custom].includes(selectedDbType);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative bg-white dark:bg-secondary-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">
              Create Application
            </h2>
            <button
              onClick={handleClose}
              className="p-1 rounded-md text-secondary-400 dark:text-secondary-500 hover:text-secondary-500 dark:hover:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 1 ? 'bg-primary-600 text-white' : 'bg-secondary-300 dark:bg-secondary-600 text-secondary-600 dark:text-secondary-400'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium text-secondary-900 dark:text-white">Application</span>
            </div>
            <div className="flex-1 h-1 mx-4 bg-secondary-200 dark:bg-secondary-700">
              <div className={`h-full ${currentStep >= 2 ? 'bg-primary-600' : 'bg-secondary-300 dark:bg-secondary-600'} transition-all`} />
            </div>
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-secondary-300 dark:bg-secondary-600 text-secondary-600 dark:text-secondary-400'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium text-secondary-900 dark:text-white">Database</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-secondary-900 dark:text-white flex items-center">
                  <Server className="w-5 h-5 mr-2" />
                  Application Details
                </h3>

                <div>
                  <label htmlFor="applicationName" className="label">
                    Application Name *
                  </label>
                  <input
                    {...register('applicationName', {
                      required: 'Application name is required',
                      minLength: {
                        value: 3,
                        message: 'Name must be at least 3 characters'
                      }
                    })}
                    type="text"
                    id="applicationName"
                    className="input"
                    placeholder="e.g., E-commerce API"
                  />
                  {errors.applicationName && (
                    <p className="mt-1 text-sm text-error-600">{errors.applicationName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="applicationDescription" className="label">
                    Description
                  </label>
                  <textarea
                    {...register('applicationDescription')}
                    id="applicationDescription"
                    rows={3}
                    className="input"
                    placeholder="Brief description of the application"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="version" className="label">
                      Version
                    </label>
                    <input
                      {...register('version')}
                      type="text"
                      id="version"
                      className="input"
                      placeholder="e.g., 1.0.0"
                    />
                  </div>

                  <div>
                    <label htmlFor="environment" className="label">
                      Environment
                    </label>
                    <select
                      {...register('environment')}
                      id="environment"
                      className="input"
                    >
                      <option value="Development">Development</option>
                      <option value="Staging">Staging</option>
                      <option value="Production">Production</option>
                      <option value="Testing">Testing</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="tags" className="label">
                    Tags
                  </label>
                  <input
                    {...register('tags')}
                    type="text"
                    id="tags"
                    className="input"
                    placeholder="e.g., api, microservice, backend (comma-separated)"
                  />
                  <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
                    Separate multiple tags with commas
                  </p>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-secondary-50 dark:bg-secondary-700 rounded-lg border border-secondary-200 dark:border-secondary-600">
                  <div className="flex items-center">
                    <input
                      {...register('isApplicationActive')}
                      type="checkbox"
                      id="isApplicationActive"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 dark:border-secondary-600 rounded"
                    />
                    <label htmlFor="isApplicationActive" className="ml-2 block text-sm font-medium text-secondary-900 dark:text-white">
                      Active Application
                    </label>
                  </div>
                  <span className="text-xs text-secondary-500 dark:text-secondary-400">
                    Application will be available for use when active
                  </span>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-secondary-900 dark:text-white flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  Database Connection
                </h3>

                <div>
                  <label htmlFor="connectionName" className="label">
                    Connection Name *
                  </label>
                  <input
                    {...register('connectionName', {
                      required: 'Connection name is required',
                      minLength: {
                        value: 3,
                        message: 'Name must be at least 3 characters'
                      }
                    })}
                    type="text"
                    id="connectionName"
                    className="input"
                    placeholder="e.g., Production Database"
                  />
                  {errors.connectionName && (
                    <p className="mt-1 text-sm text-error-600">{errors.connectionName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="connectionDescription" className="label">
                    Description
                  </label>
                  <textarea
                    {...register('connectionDescription')}
                    id="connectionDescription"
                    rows={2}
                    className="input"
                    placeholder="Brief description of the database connection"
                  />
                </div>

                <div>
                  <label htmlFor="databaseType" className="label">
                    Database Type *
                  </label>
                  <Controller
                    name="databaseType"
                    control={control}
                    rules={{ required: 'Database type is required' }}
                    render={({ field }) => (
                      <select
                        {...field}
                        id="databaseType"
                        className="input"
                        onChange={(e) => {
                          const value = parseInt(e.target.value) as DatabaseType;
                          field.onChange(value);
                          setSelectedDbType(value);
                        }}
                      >
                        {getDatabaseTypeOptions().map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.databaseType && (
                    <p className="mt-1 text-sm text-error-600">{errors.databaseType.message}</p>
                  )}
                </div>

                {isConnectionStringType() ? (
                  <div>
                    <label htmlFor="connectionString" className="label">
                      Connection String *
                    </label>
                    <textarea
                      {...register('connectionString', {
                        required: selectedDbType === DatabaseType.Custom ? 'Connection string is required' : false
                      })}
                      id="connectionString"
                      rows={3}
                      className="input"
                      placeholder="Enter your custom connection string"
                    />
                    {errors.connectionString && (
                      <p className="mt-1 text-sm text-error-600">{errors.connectionString.message}</p>
                    )}
                  </div>
                ) : isApiType() ? (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="apiBaseUrl" className="label">
                        API Base URL *
                      </label>
                      <input
                        {...register('apiBaseUrl', {
                          required: isApiType() ? 'API Base URL is required' : false
                        })}
                        type="url"
                        id="apiBaseUrl"
                        className="input"
                        placeholder="https://api.example.com"
                      />
                      {errors.apiBaseUrl && (
                        <p className="mt-1 text-sm text-error-600">{errors.apiBaseUrl.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="apiKey" className="label flex items-center">
                        <Key className="w-4 h-4 mr-1" />
                        API Key
                      </label>
                      <input
                        {...register('apiKey')}
                        type="password"
                        id="apiKey"
                        className="input"
                        placeholder="Enter API key if required"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="server" className="label">
                          Server *
                        </label>
                        <input
                          {...register('server', {
                            required: !isApiType() && !isConnectionStringType() ? 'Server is required' : false
                          })}
                          type="text"
                          id="server"
                          className="input"
                          placeholder="localhost or server IP"
                        />
                        {errors.server && (
                          <p className="mt-1 text-sm text-error-600">{errors.server.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="port" className="label">
                          Port
                        </label>
                        <input
                          {...register('port', {
                            validate: (value: number | undefined) => {
                              if (!value) return true; // Optional field
                              const port = Number(value);
                              if (isNaN(port)) return 'Port must be a number';
                              if (port < 1) return 'Port must be greater than 0';
                              if (port > 65535) return 'Port must be less than 65536';
                              return true;
                            }
                          })}
                          type="text"
                          id="port"
                          className="input"
                          placeholder="1433"
                        />
                        {errors.port && (
                          <p className="mt-1 text-sm text-error-600">{errors.port.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="database" className="label">
                        Database Name
                      </label>
                      <input
                        {...register('database')}
                        type="text"
                        id="database"
                        className="input"
                        placeholder="database name"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="username" className="label">
                          Username
                        </label>
                        <input
                          {...register('username')}
                          type="text"
                          id="username"
                          className="input"
                          placeholder="database username"
                        />
                      </div>

                      <div>
                        <label htmlFor="password" className="label">
                          Password
                        </label>
                        <input
                          {...register('password')}
                          type="password"
                          id="password"
                          className="input"
                          placeholder="database password"
                        />
                      </div>
                    </div>
                  </div>
                )}



                {/* Test Result Display */}
                {testResult && (
                  <div className={`p-4 rounded-md ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 w-4 h-4 rounded-full ${testResult.success ? 'bg-green-400' : 'bg-red-400'}`} />
                      <div className="ml-3">
                        <p className={`text-sm font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                          {testResult.success ? 'Connection Test Passed' : 'Connection Test Failed'}
                        </p>
                        <p className={`text-sm ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                          {testResult.message}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between pt-4">
              <div>
                {currentStep === 2 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="btn btn-outline"
                    disabled={isSubmitting}
                  >
                    Previous
                  </button>
                )}
              </div>
              
              <div className="flex space-x-3">
                {currentStep === 1 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    Next: Database Connection
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      className="btn btn-outline"
                      disabled={isSubmitting || isTestingConnection}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      {isTestingConnection ? 'Testing...' : 'Test Connection'}
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Creating...' : 'Create Application & Connection'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplicationWithConnectionModal;