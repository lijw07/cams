import React from 'react';

import { UseFormRegister, FieldErrors, Control, Controller } from 'react-hook-form';

import { Key, Settings, Github } from 'lucide-react';

import { DatabaseConnectionRequest, DatabaseConnectionUpdateRequest, DatabaseType } from '../../types';
import { DatabaseTypeOption } from '../../utils/databaseUtils';

interface DatabaseConnectionFieldsProps {
  register: UseFormRegister<DatabaseConnectionRequest | DatabaseConnectionUpdateRequest>;
  errors: FieldErrors<DatabaseConnectionRequest | DatabaseConnectionUpdateRequest>;
  control: Control<DatabaseConnectionRequest | DatabaseConnectionUpdateRequest>;
  selectedDbType: DatabaseType;
  setSelectedDbType: (type: DatabaseType) => void;
  getDatabaseTypeOptions: () => DatabaseTypeOption[];
  isApiType: () => boolean;
  isConnectionStringType: () => boolean;
}

const isGitHubType = (selectedDbType: DatabaseType): boolean => {
  return selectedDbType === DatabaseType.GitHub_API;
};

export const DatabaseConnectionFields: React.FC<DatabaseConnectionFieldsProps> = ({
  register,
  errors,
  control,
  selectedDbType,
  setSelectedDbType,
  getDatabaseTypeOptions,
  isApiType,
  isConnectionStringType
}) => {
  return (
    <>
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
                if (!isNaN(value)) {
                  field.onChange(value);
                  setSelectedDbType(value);
                }
              }}
            >
              {getDatabaseTypeOptions().map((option) => (
                <option 
                  key={option.value} 
                  value={option.value}
                  disabled={option.isGroup}
                  className={option.isGroup ? 'font-semibold text-gray-500 bg-gray-100 dark:bg-gray-700' : ''}
                >
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
        <ConnectionStringFields register={register} errors={errors} selectedDbType={selectedDbType} />
      ) : isGitHubType(selectedDbType) ? (
        <GitHubConnectionFields register={register} errors={errors} />
      ) : isApiType() ? (
        <ApiConnectionFields register={register} errors={errors} isApiType={isApiType} />
      ) : (
        <StandardConnectionFields register={register} errors={errors} isApiType={isApiType} isConnectionStringType={isConnectionStringType} />
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

      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              {...register('IsActive')}
              type="checkbox"
              id="isActive"
              className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-3 block text-sm font-medium text-gray-900 dark:text-gray-100">
              Active Connection
            </label>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Enable this connection for use
            </div>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          When enabled, this connection will be available for applications to use. When disabled, it will be ignored during connection attempts.
        </div>
      </div>
    </>
  );
};

const ConnectionStringFields: React.FC<{
  register: UseFormRegister<DatabaseConnectionRequest | DatabaseConnectionUpdateRequest>;
  errors: FieldErrors<DatabaseConnectionRequest | DatabaseConnectionUpdateRequest>;
  selectedDbType: DatabaseType;
}> = ({ register, errors, selectedDbType }) => (
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
);

const ApiConnectionFields: React.FC<{
  register: UseFormRegister<DatabaseConnectionRequest | DatabaseConnectionUpdateRequest>;
  errors: FieldErrors<DatabaseConnectionRequest | DatabaseConnectionUpdateRequest>;
  isApiType: () => boolean;
}> = ({ register, errors, isApiType }) => (
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
);

const GitHubConnectionFields: React.FC<{
  register: UseFormRegister<DatabaseConnectionRequest | DatabaseConnectionUpdateRequest>;
  errors: FieldErrors<DatabaseConnectionRequest | DatabaseConnectionUpdateRequest>;
}> = ({ register, errors }) => (
  <div className="space-y-4">
    <div>
      <label htmlFor="gitHubToken" className="label flex items-center">
        <Github className="w-4 h-4 mr-1" />
        GitHub Personal Access Token *
      </label>
      <input
        {...register('GitHubToken', {
          required: 'GitHub token is required'
        })}
        type="password"
        id="gitHubToken"
        className="input"
        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
      />
      {errors.GitHubToken && (
        <p className="mt-1 text-sm text-error-600">{errors.GitHubToken.message}</p>
      )}
      <p className="mt-1 text-sm text-gray-500">
        Generate a Personal Access Token from GitHub Settings → Developer settings → Personal access tokens
      </p>
    </div>

    <div>
      <label htmlFor="gitHubOrganization" className="label">
        Organization (optional)
      </label>
      <input
        {...register('GitHubOrganization')}
        type="text"
        id="gitHubOrganization"
        className="input"
        placeholder="your-organization"
      />
      <p className="mt-1 text-sm text-gray-500">
        Leave empty to access personal repositories
      </p>
    </div>

    <div>
      <label htmlFor="gitHubRepository" className="label">
        Repository Access
      </label>
      <textarea
        {...register('GitHubRepository')}
        id="gitHubRepository"
        rows={3}
        className="input"
        placeholder="repository-name&#10;another-repo&#10;org/specific-repo"
      />
      <p className="mt-1 text-sm text-gray-500">
        Enter one repository per line. Leave empty for all repositories accessible by the token.
        Format: <code>repo-name</code> or <code>org/repo-name</code>
      </p>
    </div>

    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
      <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
        GitHub API Connection Info
      </h4>
      <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
        This connection will use the GitHub REST API v3 to access repository data, issues, pull requests, and other GitHub resources.
      </p>
      <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
        <p><strong>Access Control:</strong></p>
        <ul className="list-disc list-inside ml-2 space-y-1">
          <li>Token permissions determine what resources can be accessed</li>
          <li>Organization field limits access to repos within that org</li>
          <li>Repository field further limits to specific repos only</li>
          <li>Leave fields empty for maximum access allowed by token</li>
        </ul>
      </div>
    </div>
  </div>
);

const StandardConnectionFields: React.FC<{
  register: UseFormRegister<DatabaseConnectionRequest | DatabaseConnectionUpdateRequest>;
  errors: FieldErrors<DatabaseConnectionRequest | DatabaseConnectionUpdateRequest>;
  isApiType: () => boolean;
  isConnectionStringType: () => boolean;
}> = ({ register, errors, isApiType, isConnectionStringType }) => (
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
              if (!value) return true;
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
);