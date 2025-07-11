import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { X, Database, Key, Settings } from 'lucide-react';
import { DatabaseConnectionRequest, DatabaseConnectionUpdateRequest, DatabaseConnection, DatabaseType } from '../../types';
// import { useNotifications } from '../contexts/NotificationContext';

interface DatabaseConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DatabaseConnectionRequest | DatabaseConnectionUpdateRequest) => Promise<void>;
  applicationId: number;
  applicationName: string;
  connection?: DatabaseConnection;
  mode?: 'create' | 'edit';
}

const DatabaseConnectionModal: React.FC<DatabaseConnectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  applicationId,
  applicationName,
  connection,
  mode = 'create'
}) => {
  const [selectedDbType, setSelectedDbType] = useState<DatabaseType>(DatabaseType.SqlServer);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors, isSubmitting }
  } = useForm<DatabaseConnectionRequest | DatabaseConnectionUpdateRequest>({
    defaultValues: {
      ApplicationId: applicationId,
      Name: '',
      Description: '',
      Type: DatabaseType.SqlServer,
      Server: '',
      Port: undefined,
      Database: '',
      Username: '',
      Password: '',
      ConnectionString: '',
      ApiBaseUrl: '',
      ApiKey: '',
      AdditionalSettings: '',
      IsActive: true
    }
  });

  const watchedDbType = watch('Type');

  useEffect(() => {
    setSelectedDbType(watchedDbType);
  }, [watchedDbType]);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && connection) {
        reset({
          ...(mode === 'edit' ? { Id: connection.Id } : {}),
          ApplicationId: applicationId,
          Name: connection.Name,
          Description: connection.Description || '',
          Type: connection.Type,
          Server: connection.Server,
          Port: connection.Port,
          Database: connection.Database || '',
          Username: connection.Username || '',
          Password: '', // Don't populate password for security
          ConnectionString: connection.ConnectionString || '',
          ApiBaseUrl: connection.ApiBaseUrl || '',
          ApiKey: '', // Don't populate API key for security
          AdditionalSettings: connection.AdditionalSettings || '',
          IsActive: connection.IsActive
        });
        setSelectedDbType(connection.Type);
      } else {
        reset({
          ApplicationId: applicationId,
          Name: '',
          Description: '',
          Type: DatabaseType.SqlServer,
          Server: '',
          Port: undefined,
          Database: '',
          Username: '',
          Password: '',
          ConnectionString: '',
          ApiBaseUrl: '',
          ApiKey: '',
          AdditionalSettings: '',
          IsActive: true
        });
        setSelectedDbType(DatabaseType.SqlServer);
      }
    }
  }, [isOpen, applicationId, connection, mode, reset]);

  const handleFormSubmit = async (data: DatabaseConnectionRequest | DatabaseConnectionUpdateRequest) => {
    try {
      // Convert port from string to number if provided
      const submissionData = {
        ...data,
        Port: data.Port ? parseInt(data.Port.toString()) : undefined
      };
      
      // Add ID for edit mode
      if (mode === 'edit' && connection) {
        (submissionData as DatabaseConnectionUpdateRequest).Id = connection.Id;
      }
      
      await onSubmit(submissionData);
      reset();
      onClose();
    } catch (error) {
      console.error('Error submitting database connection:', error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
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
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === 'edit' ? 'Edit Database Connection' : 'Add Database Connection'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {mode === 'edit' 
                  ? `Editing: ${connection?.Name}` 
                  : `Adding connection to: ${applicationName}`
                }
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Connection Details
              </h3>

              <div>
                <label htmlFor="Name" className="label">
                  Connection Name *
                </label>
                <input
                  {...register('Name', {
                    required: 'Connection name is required',
                    minLength: {
                      value: 3,
                      message: 'Name must be at least 3 characters'
                    }
                  })}
                  type="text"
                  id="Name"
                  className="input"
                  placeholder="e.g., Production Database"
                />
                {errors.Name && (
                  <p className="mt-1 text-sm text-error-600">{errors.Name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="label">
                  Description
                </label>
                <textarea
                  {...register('Description')}
                  id="description"
                  rows={2}
                  className="input"
                  placeholder="Brief description of the database connection"
                />
              </div>

              <div>
                <label htmlFor="Type" className="label">
                  Database Type *
                </label>
                <Controller
                  name="Type"
                  control={control}
                  rules={{ required: 'Database type is required' }}
                  render={({ field }) => (
                    <select
                      {...field}
                      id="Type"
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
                {errors.Type && (
                  <p className="mt-1 text-sm text-error-600">{errors.Type.message}</p>
                )}
              </div>

              {isConnectionStringType() ? (
                <div>
                  <label htmlFor="connectionString" className="label">
                    Connection String *
                  </label>
                  <textarea
                    {...register('ConnectionString', {
                      required: selectedDbType === DatabaseType.Custom ? 'Connection string is required' : false
                    })}
                    id="connectionString"
                    rows={3}
                    className="input"
                    placeholder="Enter your custom connection string"
                  />
                  {errors.ConnectionString && (
                    <p className="mt-1 text-sm text-error-600">{errors.ConnectionString.message}</p>
                  )}
                </div>
              ) : isApiType() ? (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="apiBaseUrl" className="label">
                      API Base URL *
                    </label>
                    <input
                      {...register('ApiBaseUrl', {
                        required: isApiType() ? 'API Base URL is required' : false
                      })}
                      type="url"
                      id="apiBaseUrl"
                      className="input"
                      placeholder="https://api.example.com"
                    />
                    {errors.ApiBaseUrl && (
                      <p className="mt-1 text-sm text-error-600">{errors.ApiBaseUrl.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="apiKey" className="label flex items-center">
                      <Key className="w-4 h-4 mr-1" />
                      API Key
                    </label>
                    <input
                      {...register('ApiKey')}
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
                        {...register('Server', {
                          required: !isApiType() && !isConnectionStringType() ? 'Server is required' : false
                        })}
                        type="text"
                        id="server"
                        className="input"
                        placeholder="localhost or server IP"
                      />
                      {errors.Server && (
                        <p className="mt-1 text-sm text-error-600">{errors.Server.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="port" className="label">
                        Port
                      </label>
                      <input
                        {...register('Port', {
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
                      {errors.Port && (
                        <p className="mt-1 text-sm text-error-600">{errors.Port.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="database" className="label">
                      Database Name
                    </label>
                    <input
                      {...register('Database')}
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
                        {...register('Username')}
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
                        {...register('Password')}
                        type="password"
                        id="password"
                        className="input"
                        placeholder="database password"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="additionalSettings" className="label flex items-center">
                  <Settings className="w-4 h-4 mr-1" />
                  Additional Settings
                </label>
                <textarea
                  {...register('AdditionalSettings')}
                  id="additionalSettings"
                  rows={2}
                  className="input"
                  placeholder="JSON format additional settings"
                />
              </div>

              <div className="flex items-center">
                <input
                  {...register('IsActive')}
                  type="checkbox"
                  id="isActive"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-outline"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? (mode === 'edit' ? 'Updating...' : 'Creating...') 
                  : (mode === 'edit' ? 'Update Connection' : 'Add Connection')
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DatabaseConnectionModal;