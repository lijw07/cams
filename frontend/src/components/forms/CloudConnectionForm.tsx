import React from 'react';
import { UseFormRegister, FieldErrors, Control, Controller, UseFormWatch } from 'react-hook-form';
import { Cloud, Shield } from 'lucide-react';
import { DatabaseType, AuthenticationMethod, ApplicationWithConnectionRequest } from '../../types';
import { FormField, Input, Select, Textarea } from '../common';

interface CloudConnectionFormProps {
  register: UseFormRegister<ApplicationWithConnectionRequest>;
  control: Control<ApplicationWithConnectionRequest>;
  errors: FieldErrors<ApplicationWithConnectionRequest>;
  databaseType: DatabaseType;
  watch: UseFormWatch<ApplicationWithConnectionRequest>;
}

const CloudConnectionForm: React.FC<CloudConnectionFormProps> = ({ 
  register, 
  control,
  errors, 
  databaseType,
  watch 
}) => {
  const authMethod = watch('AuthenticationMethod');

  const getAuthMethodOptions = () => {
    switch (databaseType) {
      case DatabaseType.AWS_RDS:
      case DatabaseType.AWS_DynamoDB:
      case DatabaseType.AWS_S3:
        return [
          { value: AuthenticationMethod.AWS_IAM, label: 'AWS IAM' },
          { value: AuthenticationMethod.BasicAuth, label: 'Access Key' },
        ];
      case DatabaseType.Azure_SQL:
      case DatabaseType.Azure_CosmosDB:
      case DatabaseType.Azure_Storage:
        return [
          { value: AuthenticationMethod.Azure_AD, label: 'Azure AD' },
          { value: AuthenticationMethod.BasicAuth, label: 'Connection String' },
          { value: AuthenticationMethod.ApiKey, label: 'API Key' },
        ];
      case DatabaseType.Google_CloudSQL:
      case DatabaseType.Google_Firestore:
      case DatabaseType.Google_BigQuery:
        return [
          { value: AuthenticationMethod.Google_OAuth, label: 'Google OAuth' },
          { value: AuthenticationMethod.JWT, label: 'Service Account' },
          { value: AuthenticationMethod.ApiKey, label: 'API Key' },
        ];
      case DatabaseType.Salesforce_API:
        return [
          { value: AuthenticationMethod.OAuth2, label: 'OAuth 2.0' },
          { value: AuthenticationMethod.BasicAuth, label: 'Username/Password' },
        ];
      case DatabaseType.ServiceNow_API:
        return [
          { value: AuthenticationMethod.BasicAuth, label: 'Basic Auth' },
          { value: AuthenticationMethod.OAuth2, label: 'OAuth 2.0' },
        ];
      case DatabaseType.Snowflake:
        return [
          { value: AuthenticationMethod.BasicAuth, label: 'Username/Password' },
          { value: AuthenticationMethod.JWT, label: 'Key Pair' },
          { value: AuthenticationMethod.OAuth2, label: 'OAuth' },
        ];
      case DatabaseType.Databricks:
        return [
          { value: AuthenticationMethod.ApiKey, label: 'Personal Access Token' },
          { value: AuthenticationMethod.OAuth2, label: 'OAuth' },
        ];
      default:
        return [
          { value: AuthenticationMethod.None, label: 'None' },
          { value: AuthenticationMethod.BasicAuth, label: 'Basic Auth' },
          { value: AuthenticationMethod.ApiKey, label: 'API Key' },
        ];
    }
  };

  const renderAWSFields = () => (
    <>
      <FormField label="Region" required error={errors.Region?.message}>
        <Input
          {...register('Region', { required: 'Region is required' })}
          placeholder="e.g., us-east-1"
          error={!!errors.Region}
        />
      </FormField>

      {authMethod === AuthenticationMethod.AWS_IAM && (
        <>
          <FormField label="Account ID" error={errors.AccountId?.message}>
            <Input
              {...register('AccountId')}
              placeholder="AWS Account ID"
              error={!!errors.AccountId}
            />
          </FormField>

          <FormField label="Session Token" error={errors.SessionToken?.message}>
            <Input
              {...register('SessionToken')}
              type="password"
              placeholder="Optional session token"
              error={!!errors.SessionToken}
            />
          </FormField>
        </>
      )}

      {authMethod === AuthenticationMethod.BasicAuth && (
        <>
          <FormField label="Access Key ID" required error={errors.AccessKeyId?.message}>
            <Input
              {...register('AccessKeyId', { required: 'Access Key ID is required' })}
              placeholder="AWS Access Key ID"
              error={!!errors.AccessKeyId}
            />
          </FormField>

          <FormField label="Secret Access Key" required error={errors.SecretAccessKey?.message}>
            <Input
              {...register('SecretAccessKey', { required: 'Secret Access Key is required' })}
              type="password"
              placeholder="AWS Secret Access Key"
              error={!!errors.SecretAccessKey}
            />
          </FormField>
        </>
      )}

      {databaseType === DatabaseType.AWS_RDS && (
        <FormField label="Instance Identifier" error={errors.InstanceId?.message}>
          <Input
            {...register('InstanceId')}
            placeholder="RDS instance identifier"
            error={!!errors.InstanceId}
          />
        </FormField>
      )}

      {databaseType === DatabaseType.AWS_DynamoDB && (
        <FormField label="Table Name" error={errors.Database?.message}>
          <Input
            {...register('Database')}
            placeholder="DynamoDB table name"
            error={!!errors.Database}
          />
        </FormField>
      )}

      {databaseType === DatabaseType.AWS_S3 && (
        <FormField label="Bucket Name" error={errors.Database?.message}>
          <Input
            {...register('Database')}
            placeholder="S3 bucket name"
            error={!!errors.Database}
          />
        </FormField>
      )}
    </>
  );

  const renderAzureFields = () => (
    <>
      <FormField label="Subscription ID" required error={errors.SubscriptionId?.message}>
        <Input
          {...register('SubscriptionId', { required: 'Subscription ID is required' })}
          placeholder="Azure Subscription ID"
          error={!!errors.SubscriptionId}
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
              placeholder="Application (client) ID"
              error={!!errors.ClientId}
            />
          </FormField>

          <FormField label="Client Secret" required error={errors.ClientSecret?.message}>
            <Input
              {...register('ClientSecret', { required: 'Client Secret is required' })}
              type="password"
              placeholder="Client secret value"
              error={!!errors.ClientSecret}
            />
          </FormField>
        </>
      )}

      {databaseType === DatabaseType.Azure_SQL && (
        <>
          <FormField label="Server Name" required error={errors.Server?.message}>
            <Input
              {...register('Server', { required: 'Server name is required' })}
              placeholder="servername.database.windows.net"
              error={!!errors.Server}
            />
          </FormField>

          <FormField label="Database Name" error={errors.Database?.message}>
            <Input
              {...register('Database')}
              placeholder="Database name"
              error={!!errors.Database}
            />
          </FormField>
        </>
      )}

      {databaseType === DatabaseType.Azure_CosmosDB && (
        <>
          <FormField label="Account Name" required error={errors.Server?.message}>
            <Input
              {...register('Server', { required: 'Account name is required' })}
              placeholder="Cosmos DB account name"
              error={!!errors.Server}
            />
          </FormField>

          <FormField label="Database ID" error={errors.Database?.message}>
            <Input
              {...register('Database')}
              placeholder="Database ID"
              error={!!errors.Database}
            />
          </FormField>
        </>
      )}

      {authMethod === AuthenticationMethod.BasicAuth && (
        <FormField label="Connection String" required error={errors.ConnectionString?.message}>
          <Textarea
            {...register('ConnectionString', { required: 'Connection string is required' })}
            placeholder="Azure connection string"
            rows={3}
          />
        </FormField>
      )}
    </>
  );

  const renderGoogleFields = () => (
    <>
      <FormField label="Project ID" required error={errors.ProjectId?.message}>
        <Input
          {...register('ProjectId', { required: 'Project ID is required' })}
          placeholder="Google Cloud Project ID"
          error={!!errors.ProjectId}
        />
      </FormField>

      {authMethod === AuthenticationMethod.JWT && (
        <FormField label="Service Account JSON" required error={errors.AdditionalSettings?.message}>
          <Textarea
            {...register('AdditionalSettings', { required: 'Service account JSON is required' })}
            placeholder='Paste your service account JSON key here'
            rows={6}
          />
        </FormField>
      )}

      {authMethod === AuthenticationMethod.ApiKey && (
        <FormField label="API Key" required error={errors.ApiKey?.message}>
          <Input
            {...register('ApiKey', { required: 'API Key is required' })}
            type="password"
            placeholder="Google Cloud API Key"
            error={!!errors.ApiKey}
          />
        </FormField>
      )}

      {databaseType === DatabaseType.Google_CloudSQL && (
        <>
          <FormField label="Instance Connection Name" error={errors.InstanceId?.message}>
            <Input
              {...register('InstanceId')}
              placeholder="project:region:instance"
              error={!!errors.InstanceId}
            />
          </FormField>

          <FormField label="Database Name" error={errors.Database?.message}>
            <Input
              {...register('Database')}
              placeholder="Database name"
              error={!!errors.Database}
            />
          </FormField>
        </>
      )}

      {databaseType === DatabaseType.Google_BigQuery && (
        <FormField label="Dataset ID" error={errors.Database?.message}>
          <Input
            {...register('Database')}
            placeholder="BigQuery dataset ID"
            error={!!errors.Database}
          />
        </FormField>
      )}
    </>
  );

  const renderSalesforceFields = () => (
    <>
      <FormField label="Instance URL" required error={errors.ApiBaseUrl?.message}>
        <Input
          {...register('ApiBaseUrl', { required: 'Instance URL is required' })}
          placeholder="https://your-instance.salesforce.com"
          error={!!errors.ApiBaseUrl}
        />
      </FormField>

      {authMethod === AuthenticationMethod.OAuth2 && (
        <>
          <FormField label="Client ID" required error={errors.ClientId?.message}>
            <Input
              {...register('ClientId', { required: 'Client ID is required' })}
              placeholder="Connected App Client ID"
              error={!!errors.ClientId}
            />
          </FormField>

          <FormField label="Client Secret" required error={errors.ClientSecret?.message}>
            <Input
              {...register('ClientSecret', { required: 'Client Secret is required' })}
              type="password"
              placeholder="Connected App Client Secret"
              error={!!errors.ClientSecret}
            />
          </FormField>

          <FormField label="Refresh Token" error={errors.AdditionalSettings?.message}>
            <Input
              {...register('AdditionalSettings')}
              type="password"
              placeholder="OAuth Refresh Token"
              error={!!errors.AdditionalSettings}
            />
          </FormField>
        </>
      )}

      {authMethod === AuthenticationMethod.BasicAuth && (
        <>
          <FormField label="Username" required error={errors.Username?.message}>
            <Input
              {...register('Username', { required: 'Username is required' })}
              placeholder="Salesforce username"
              error={!!errors.Username}
            />
          </FormField>

          <FormField label="Password + Security Token" required error={errors.Password?.message}>
            <Input
              {...register('Password', { required: 'Password is required' })}
              type="password"
              placeholder="Password + security token"
              error={!!errors.Password}
            />
          </FormField>
        </>
      )}
    </>
  );

  const renderSnowflakeFields = () => (
    <>
      <FormField label="Account" required error={errors.Server?.message}>
        <Input
          {...register('Server', { required: 'Account is required' })}
          placeholder="account.region.snowflakecomputing.com"
          error={!!errors.Server}
        />
      </FormField>

      <FormField label="Warehouse" error={errors.AdditionalSettings?.message}>
        <Input
          {...register('AdditionalSettings')}
          placeholder="Warehouse name"
          error={!!errors.AdditionalSettings}
        />
      </FormField>

      <FormField label="Database" error={errors.Database?.message}>
        <Input
          {...register('Database')}
          placeholder="Database name"
          error={!!errors.Database}
        />
      </FormField>

      <FormField label="Schema">
        <Input
          {...register('AdditionalSettings')}
          placeholder="Schema name"
        />
      </FormField>

      {authMethod === AuthenticationMethod.BasicAuth && (
        <>
          <FormField label="Username" required error={errors.Username?.message}>
            <Input
              {...register('Username', { required: 'Username is required' })}
              placeholder="Snowflake username"
              error={!!errors.Username}
            />
          </FormField>

          <FormField label="Password" required error={errors.Password?.message}>
            <Input
              {...register('Password', { required: 'Password is required' })}
              type="password"
              placeholder="Snowflake password"
              error={!!errors.Password}
            />
          </FormField>
        </>
      )}
    </>
  );

  const renderCloudFields = () => {
    if (databaseType >= DatabaseType.AWS_RDS && databaseType <= DatabaseType.AWS_S3) {
      return renderAWSFields();
    }
    if (databaseType >= DatabaseType.Azure_SQL && databaseType <= DatabaseType.Azure_Storage) {
      return renderAzureFields();
    }
    if (databaseType >= DatabaseType.Google_CloudSQL && databaseType <= DatabaseType.Google_BigQuery) {
      return renderGoogleFields();
    }
    if (databaseType === DatabaseType.Salesforce_API) {
      return renderSalesforceFields();
    }
    if (databaseType === DatabaseType.Snowflake) {
      return renderSnowflakeFields();
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-secondary-900 dark:text-white flex items-center">
        <Cloud className="w-5 h-5 mr-2" />
        Cloud Platform Configuration
      </h3>

      <FormField label="Authentication Method" required>
        <Controller
          name="AuthenticationMethod"
          control={control}
          rules={{ required: 'Authentication method is required' }}
          render={({ field }) => (
            <Select
              {...field}
              options={getAuthMethodOptions()}
              error={!!errors.AuthenticationMethod}
            />
          )}
        />
      </FormField>

      {renderCloudFields()}

      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-1">Security Note</p>
            <p>Credentials are encrypted and stored securely. For production use, consider using managed identities or service accounts where available.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloudConnectionForm;