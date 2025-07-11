import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { DatabaseType, AuthenticationMethod, ApplicationWithConnectionRequest } from '../../../types';
import { FormField, Input, Textarea } from '../../common';

interface AzureConnectionFieldsProps {
  register: UseFormRegister<ApplicationWithConnectionRequest>;
  errors: FieldErrors<ApplicationWithConnectionRequest>;
  databaseType: DatabaseType;
  authMethod: AuthenticationMethod;
}

const AzureConnectionFields: React.FC<AzureConnectionFieldsProps> = ({
  register,
  errors,
  databaseType,
  authMethod
}) => {
  return (
    <>
      <FormField label="Subscription ID" required error={errors.SubscriptionId?.message}>
        <Input
          {...register('SubscriptionId', { required: 'Subscription ID is required' })}
          placeholder="Azure Subscription ID"
          error={!!errors.SubscriptionId}
        />
      </FormField>

      <FormField label="Resource Group" required error={errors.ResourceGroup?.message}>
        <Input
          {...register('ResourceGroup', { required: 'Resource Group is required' })}
          placeholder="Azure Resource Group"
          error={!!errors.ResourceGroup}
        />
      </FormField>

      {authMethod === AuthenticationMethod.Azure_AD && (
        <>
          <FormField label="Tenant ID" required error={errors.TenantId?.message}>
            <Input
              {...register('TenantId', { required: 'Tenant ID is required' })}
              placeholder="Azure AD Tenant ID"
              error={!!errors.TenantId}
            />
          </FormField>

          <FormField label="Client ID" required error={errors.ClientId?.message}>
            <Input
              {...register('ClientId', { required: 'Client ID is required' })}
              placeholder="Azure AD Application ID"
              error={!!errors.ClientId}
            />
          </FormField>

          <FormField label="Client Secret" required error={errors.ClientSecret?.message}>
            <Input
              {...register('ClientSecret', { required: 'Client Secret is required' })}
              type="password"
              placeholder="Azure AD Client Secret"
              error={!!errors.ClientSecret}
            />
          </FormField>
        </>
      )}

      {authMethod === AuthenticationMethod.BasicAuth && (
        <FormField label="Connection String" required error={errors.ConnectionString?.message}>
          <Textarea
            {...register('ConnectionString', { required: 'Connection String is required' })}
            placeholder="Azure connection string"
            rows={3}
            error={!!errors.ConnectionString}
          />
        </FormField>
      )}

      {authMethod === AuthenticationMethod.ApiKey && (
        <FormField label="API Key" required error={errors.ApiKey?.message}>
          <Input
            {...register('ApiKey', { required: 'API Key is required' })}
            type="password"
            placeholder="Azure API Key"
            error={!!errors.ApiKey}
          />
        </FormField>
      )}

      {databaseType === DatabaseType.Azure_SQL && (
        <FormField label="Server Name" required error={errors.Server?.message}>
          <Input
            {...register('Server', { required: 'Server name is required' })}
            placeholder="Azure SQL Server name"
            error={!!errors.Server}
          />
        </FormField>
      )}

      {databaseType === DatabaseType.Azure_CosmosDB && (
        <FormField label="Database Account" required error={errors.Server?.message}>
          <Input
            {...register('Server', { required: 'Database account is required' })}
            placeholder="Cosmos DB account name"
            error={!!errors.Server}
          />
        </FormField>
      )}

      {databaseType === DatabaseType.Azure_Storage && (
        <FormField label="Storage Account" required error={errors.Server?.message}>
          <Input
            {...register('Server', { required: 'Storage account is required' })}
            placeholder="Azure Storage account name"
            error={!!errors.Server}
          />
        </FormField>
      )}
    </>
  );
};

export default AzureConnectionFields;