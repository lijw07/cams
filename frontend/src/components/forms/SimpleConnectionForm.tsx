import React from 'react';
import { UseFormRegister, FieldErrors, Control, Controller } from 'react-hook-form';
import { Database, Key, Settings } from 'lucide-react';
import { DatabaseConnectionRequest, DatabaseType } from '../../types';
import { FormField, Input, Textarea, Select, Checkbox } from '../common';

interface SimpleConnectionFormProps {
  register: UseFormRegister<DatabaseConnectionRequest>;
  control: Control<DatabaseConnectionRequest>;
  errors: FieldErrors<DatabaseConnectionRequest>;
  selectedDbType: DatabaseType;
  onDbTypeChange: (type: DatabaseType) => void;
  applicationName: string;
}

const SimpleConnectionForm: React.FC<SimpleConnectionFormProps> = ({
  register,
  control,
  errors,
  selectedDbType,
  onDbTypeChange,
  applicationName
}) => {
  const getDatabaseTypeOptions = () => [
    { value: DatabaseType.SqlServer.toString(), label: 'SQL Server' },
    { value: DatabaseType.MySQL.toString(), label: 'MySQL' },
    { value: DatabaseType.PostgreSQL.toString(), label: 'PostgreSQL' },
    { value: DatabaseType.Oracle.toString(), label: 'Oracle' },
    { value: DatabaseType.SQLite.toString(), label: 'SQLite' },
    { value: DatabaseType.MongoDB.toString(), label: 'MongoDB' },
    { value: DatabaseType.Redis.toString(), label: 'Redis' },
    { value: DatabaseType.RestApi.toString(), label: 'REST API' },
    { value: DatabaseType.GraphQL.toString(), label: 'GraphQL' },
    { value: DatabaseType.WebSocket.toString(), label: 'WebSocket' },
    { value: DatabaseType.Custom.toString(), label: 'Custom' }
  ];

  const isApiType = () => {
    return [DatabaseType.RestApi, DatabaseType.GraphQL, DatabaseType.WebSocket].includes(selectedDbType);
  };

  const isConnectionStringType = () => {
    return [DatabaseType.Custom].includes(selectedDbType);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-secondary-900 dark:text-white flex items-center">
          <Database className="w-5 h-5 mr-2" />
          Connection Details
        </h3>
        <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
          Adding connection to: <span className="font-medium">{applicationName}</span>
        </p>
      </div>

      <FormField 
        label="Connection Name" 
        required 
        error={errors.name?.message}
      >
        <Input
          {...register('name', {
            required: 'Connection name is required',
            minLength: {
              value: 3,
              message: 'Name must be at least 3 characters'
            }
          })}
          placeholder="e.g., Production Database"
          error={!!errors.name}
        />
      </FormField>

      <FormField label="Description">
        <Textarea
          {...register('description')}
          placeholder="Brief description of the database connection"
          resize="vertical"
        />
      </FormField>

      <FormField 
        label="Database Type" 
        required 
        error={errors.type?.message}
      >
        <Controller
          name="type"
          control={control}
          rules={{ required: 'Database type is required' }}
          render={({ field }) => (
            <Select
              {...field}
              options={getDatabaseTypeOptions()}
              onChange={(e) => {
                const value = parseInt(e.target.value) as DatabaseType;
                field.onChange(value);
                onDbTypeChange(value);
              }}
              error={!!errors.type}
            />
          )}
        />
      </FormField>

      {isConnectionStringType() && (
        <FormField 
          label="Connection String" 
          required 
          error={errors.connectionString?.message}
        >
          <Textarea
            {...register('connectionString', {
              required: selectedDbType === DatabaseType.Custom ? 'Connection string is required' : false
            })}
            placeholder="Enter your custom connection string"
            error={!!errors.connectionString}
          />
        </FormField>
      )}

      {isApiType() && (
        <>
          <FormField 
            label="API Base URL" 
            required 
            error={errors.apiBaseUrl?.message}
          >
            <Input
              {...register('apiBaseUrl', {
                required: isApiType() ? 'API Base URL is required' : false
              })}
              type="url"
              placeholder="https://api.example.com"
              error={!!errors.apiBaseUrl}
            />
          </FormField>

          <FormField label="API Key">
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
              <Input
                {...register('apiKey')}
                type="password"
                placeholder="Enter API key if required"
                className="pl-10"
              />
            </div>
          </FormField>
        </>
      )}

      {!isApiType() && !isConnectionStringType() && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <FormField 
              label="Server" 
              required 
              error={errors.server?.message}
            >
              <Input
                {...register('server', {
                  required: !isApiType() && !isConnectionStringType() ? 'Server is required' : false
                })}
                placeholder="localhost or server IP"
                error={!!errors.server}
              />
            </FormField>

            <FormField 
              label="Port" 
              error={errors.port?.message}
            >
              <Input
                {...register('port', {
                  validate: (value: number | undefined) => {
                    if (!value) return true;
                    const port = Number(value);
                    if (isNaN(port)) return 'Port must be a number';
                    if (port < 1) return 'Port must be greater than 0';
                    if (port > 65535) return 'Port must be less than 65536';
                    return true;
                  }
                })}
                placeholder="1433"
                error={!!errors.port}
              />
            </FormField>
          </div>

          <FormField label="Database Name">
            <Input
              {...register('database')}
              placeholder="database name"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Username">
              <Input
                {...register('username')}
                placeholder="database username"
              />
            </FormField>

            <FormField label="Password">
              <Input
                {...register('password')}
                type="password"
                placeholder="database password"
              />
            </FormField>
          </div>
        </>
      )}

      <FormField label="Additional Settings" helpText="JSON format additional settings">
        <div className="relative">
          <Settings className="absolute left-3 top-3 h-4 w-4 text-secondary-400" />
          <Textarea
            {...register('additionalSettings')}
            placeholder="JSON format additional settings"
            className="pl-10"
          />
        </div>
      </FormField>

      <Checkbox
        {...register('isActive')}
        label="Active"
      />
    </div>
  );
};

export default SimpleConnectionForm;