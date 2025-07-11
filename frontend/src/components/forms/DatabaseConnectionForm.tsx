import React from 'react';
import { UseFormRegister, FieldErrors, Control, Controller } from 'react-hook-form';
import { Database, Key } from 'lucide-react';
import { ApplicationWithConnectionRequest, DatabaseType } from '@/types';
import { FormField, Input, Textarea, Select } from '../common';

interface DatabaseConnectionFormProps {
  register: UseFormRegister<ApplicationWithConnectionRequest>;
  control: Control<ApplicationWithConnectionRequest>;
  errors: FieldErrors<ApplicationWithConnectionRequest>;
  selectedDbType: DatabaseType;
  onDbTypeChange: (type: DatabaseType) => void;
}

const DatabaseConnectionForm: React.FC<DatabaseConnectionFormProps> = ({
  register,
  control,
  errors,
  selectedDbType,
  onDbTypeChange
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
      <h3 className="text-lg font-medium text-secondary-900 dark:text-white flex items-center">
        <Database className="w-5 h-5 mr-2" />
        Database Connection
      </h3>

      <FormField 
        label="Connection Name" 
        required 
        error={errors.ConnectionName?.message}
      >
        <Input
          {...register('ConnectionName', {
            required: 'Connection name is required',
            minLength: {
              value: 3,
              message: 'Name must be at least 3 characters'
            }
          })}
          placeholder="e.g., Production Database"
          error={!!errors.ConnectionName}
        />
      </FormField>

      <FormField label="Description">
        <Textarea
          {...register('ConnectionDescription')}
          placeholder="Brief description of the database connection"
          resize="vertical"
        />
      </FormField>

      <FormField 
        label="Database Type" 
        required 
        error={errors.DatabaseType?.message}
      >
        <Controller
          name="DatabaseType"
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
              error={!!errors.DatabaseType}
            />
          )}
        />
      </FormField>

      {isConnectionStringType() && (
        <FormField 
          label="Connection String" 
          required 
          error={errors.ConnectionString?.message}
        >
          <Textarea
            {...register('ConnectionString', {
              required: selectedDbType === DatabaseType.Custom ? 'Connection string is required' : false
            })}
            placeholder="Enter your custom connection string"
            error={!!errors.ConnectionString}
          />
        </FormField>
      )}

      {isApiType() && (
        <>
          <FormField 
            label="API Base URL" 
            required 
            error={errors.ApiBaseUrl?.message}
          >
            <Input
              {...register('ApiBaseUrl', {
                required: isApiType() ? 'API Base URL is required' : false
              })}
              type="url"
              placeholder="https://api.example.com"
              error={!!errors.ApiBaseUrl}
            />
          </FormField>

          <FormField label="API Key">
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
              <Input
                {...register('ApiKey')}
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
              error={errors.Server?.message}
            >
              <Input
                {...register('Server', {
                  required: !isApiType() && !isConnectionStringType() ? 'Server is required' : false
                })}
                placeholder="localhost or server IP"
                error={!!errors.Server}
              />
            </FormField>

            <FormField 
              label="Port" 
              error={errors.Port?.message}
            >
              <Input
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
                placeholder="1433"
                error={!!errors.Port}
              />
            </FormField>
          </div>

          <FormField label="Database Name">
            <Input
              {...register('Database')}
              placeholder="database name"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Username">
              <Input
                {...register('Username')}
                placeholder="database username"
              />
            </FormField>

            <FormField label="Password">
              <Input
                {...register('Password')}
                type="password"
                placeholder="database password"
              />
            </FormField>
          </div>
        </>
      )}
    </div>
  );
};

export default DatabaseConnectionForm;