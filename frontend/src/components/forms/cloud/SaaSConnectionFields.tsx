import React from 'react';

import { UseFormRegister, FieldErrors } from 'react-hook-form';

import { DatabaseType, AuthenticationMethod, ApplicationWithConnectionRequest } from '../../../types';
import { FormField, Input, Textarea } from '../../common';

interface SaaSConnectionFieldsProps {
  register: UseFormRegister<ApplicationWithConnectionRequest>;
  errors: FieldErrors<ApplicationWithConnectionRequest>;
  databaseType: DatabaseType;
  authMethod: AuthenticationMethod;
}

const SaaSConnectionFields: React.FC<SaaSConnectionFieldsProps> = ({
  register,
  errors,
  databaseType,
  authMethod
}) => {
  return (
    <>
      <FormField label="Server URL" required error={errors.Server?.message}>
        <Input
          {...register('Server', { required: 'Server URL is required' })}
          placeholder={getServerPlaceholder(databaseType)}
          error={!!errors.Server}
        />
      </FormField>

      {authMethod === AuthenticationMethod.BasicAuth && (
        <>
          <FormField label="Username" required error={errors.Username?.message}>
            <Input
              {...register('Username', { required: 'Username is required' })}
              placeholder="Username"
              error={!!errors.Username}
            />
          </FormField>

          <FormField label="Password" required error={errors.Password?.message}>
            <Input
              {...register('Password', { required: 'Password is required' })}
              type="password"
              placeholder="Password"
              error={!!errors.Password}
            />
          </FormField>
        </>
      )}

      {authMethod === AuthenticationMethod.OAuth2 && (
        <>
          <FormField label="Client ID" required error={errors.ClientId?.message}>
            <Input
              {...register('ClientId', { required: 'Client ID is required' })}
              placeholder="OAuth Client ID"
              error={!!errors.ClientId}
            />
          </FormField>

          <FormField label="Client Secret" required error={errors.ClientSecret?.message}>
            <Input
              {...register('ClientSecret', { required: 'Client Secret is required' })}
              type="password"
              placeholder="OAuth Client Secret"
              error={!!errors.ClientSecret}
            />
          </FormField>

          <FormField label="Redirect URI" error={errors.RedirectUri?.message}>
            <Input
              {...register('RedirectUri')}
              placeholder="OAuth Redirect URI"
              error={!!errors.RedirectUri}
            />
          </FormField>
        </>
      )}

      {authMethod === AuthenticationMethod.ApiKey && (
        <FormField label="API Key" required error={errors.ApiKey?.message}>
          <Input
            {...register('ApiKey', { required: 'API Key is required' })}
            type="password"
            placeholder="API Key"
            error={!!errors.ApiKey}
          />
        </FormField>
      )}

      {authMethod === AuthenticationMethod.JWT && (
        <>
          <FormField label="Private Key" required error={errors.PrivateKey?.message}>
            <Textarea
              {...register('PrivateKey', { required: 'Private Key is required' })}
              placeholder="Private key for JWT authentication"
              rows={4}
              error={!!errors.PrivateKey}
            />
          </FormField>

          <FormField label="Public Key" error={errors.PublicKey?.message}>
            <Textarea
              {...register('PublicKey')}
              placeholder="Public key (if required)"
              rows={4}
              error={!!errors.PublicKey}
            />
          </FormField>
        </>
      )}

      {databaseType === DatabaseType.Snowflake && (
        <>
          <FormField label="Account" required error={errors.Account?.message}>
            <Input
              {...register('Account', { required: 'Account is required' })}
              placeholder="Snowflake account identifier"
              error={!!errors.Account}
            />
          </FormField>

          <FormField label="Warehouse" error={errors.Warehouse?.message}>
            <Input
              {...register('Warehouse')}
              placeholder="Snowflake warehouse"
              error={!!errors.Warehouse}
            />
          </FormField>

          <FormField label="Schema" error={errors.Schema?.message}>
            <Input
              {...register('Schema')}
              placeholder="Snowflake schema"
              error={!!errors.Schema}
            />
          </FormField>
        </>
      )}

      {databaseType === DatabaseType.Databricks && (
        <>
          <FormField label="Workspace URL" required error={errors.WorkspaceUrl?.message}>
            <Input
              {...register('WorkspaceUrl', { required: 'Workspace URL is required' })}
              placeholder="https://your-workspace.databricks.com"
              error={!!errors.WorkspaceUrl}
            />
          </FormField>

          <FormField label="Cluster ID" error={errors.ClusterId?.message}>
            <Input
              {...register('ClusterId')}
              placeholder="Databricks cluster ID"
              error={!!errors.ClusterId}
            />
          </FormField>
        </>
      )}
    </>
  );
};

const getServerPlaceholder = (databaseType: DatabaseType): string => {
  switch (databaseType) {
    case DatabaseType.Salesforce_API:
      return 'https://your-domain.salesforce.com';
    case DatabaseType.ServiceNow_API:
      return 'https://your-instance.service-now.com';
    case DatabaseType.Snowflake:
      return 'https://account.snowflakecomputing.com';
    case DatabaseType.Databricks:
      return 'https://your-workspace.databricks.com';
    default:
      return 'Server URL';
  }
};

export default SaaSConnectionFields;