import React from 'react';

import { UseFormRegister, FieldErrors, Control, Controller } from 'react-hook-form';

import { Key, Settings } from 'lucide-react';

import { DatabaseConnectionRequest, DatabaseConnectionUpdateRequest, DatabaseType } from '../../types';

interface DatabaseConnectionFieldsProps {
  register: UseFormRegister<DatabaseConnectionRequest | DatabaseConnectionUpdateRequest>;
  errors: FieldErrors<DatabaseConnectionRequest | DatabaseConnectionUpdateRequest>;
  control: Control<DatabaseConnectionRequest | DatabaseConnectionUpdateRequest>;
  selectedDbType: DatabaseType;
  setSelectedDbType: (type: DatabaseType) => void;
  getDatabaseTypeOptions: () => { value: DatabaseType; label: string }[];
  isApiType: () => boolean;
  isConnectionStringType: () => boolean;
}

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
        <ConnectionStringFields register={register} errors={errors} selectedDbType={selectedDbType} />
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