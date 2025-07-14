import React from 'react';

import { UseFormRegister, Control, Controller, FieldErrors, UseFormWatch } from 'react-hook-form';

import { Database, Key } from 'lucide-react';

import { ApplicationWithConnectionRequest, DatabaseType } from '../../types';

import CloudConnectionForm from './CloudConnectionForm';

interface DatabaseConnectionStepProps {
  register: UseFormRegister<ApplicationWithConnectionRequest>;
  control: Control<ApplicationWithConnectionRequest>;
  errors: FieldErrors<ApplicationWithConnectionRequest>;
  watch: UseFormWatch<ApplicationWithConnectionRequest>;
  selectedDbType: DatabaseType;
  setSelectedDbType: (type: DatabaseType) => void;
  getDatabaseTypeOptions: () => Array<{ value: DatabaseType; label: string }>;
  isApiType: () => boolean;
  isConnectionStringType: () => boolean;
  isCloudPlatform: () => boolean;
  testResult: { success: boolean; message: string } | null;
  handleTestConnection?: () => Promise<void>;
  isTestingConnection?: boolean;
}

const DatabaseConnectionStep: React.FC<DatabaseConnectionStepProps> = ({
  register,
  control,
  errors,
  watch,
  selectedDbType,
  setSelectedDbType,
  getDatabaseTypeOptions,
  isApiType,
  isConnectionStringType,
  isCloudPlatform,
  testResult,
  handleTestConnection,
  isTestingConnection
}) => {
  return (
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
          {...register('ConnectionName', {
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
        {errors.ConnectionName && (
          <p className="mt-1 text-sm text-error-600">{errors.ConnectionName.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="connectionDescription" className="label">
          Description
        </label>
        <textarea
          {...register('ConnectionDescription')}
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
          name="DatabaseType"
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
        {errors.DatabaseType && (
          <p className="mt-1 text-sm text-error-600">{errors.DatabaseType.message}</p>
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
      ) : isCloudPlatform() ? (
        <CloudConnectionForm
          register={register}
          control={control}
          errors={errors}
          databaseType={selectedDbType}
          watch={watch}
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="server" className="label">
                Server *
              </label>
              <input
                {...register('Server', {
                  required: !isApiType() && !isConnectionStringType() && !isCloudPlatform() ? 'Server is required' : false
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
  );
};

export default DatabaseConnectionStep;