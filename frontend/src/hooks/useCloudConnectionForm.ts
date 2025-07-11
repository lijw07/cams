import { DatabaseType, AuthenticationMethod } from '../types';

export const useCloudConnectionForm = () => {
  const getAuthMethodOptions = (databaseType: DatabaseType) => {
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

  const isAWSProvider = (databaseType: DatabaseType) => {
    return [DatabaseType.AWS_RDS, DatabaseType.AWS_DynamoDB, DatabaseType.AWS_S3].includes(databaseType);
  };

  const isAzureProvider = (databaseType: DatabaseType) => {
    return [DatabaseType.Azure_SQL, DatabaseType.Azure_CosmosDB, DatabaseType.Azure_Storage].includes(databaseType);
  };

  const isGoogleProvider = (databaseType: DatabaseType) => {
    return [DatabaseType.Google_CloudSQL, DatabaseType.Google_Firestore, DatabaseType.Google_BigQuery].includes(databaseType);
  };

  const isSaaSProvider = (databaseType: DatabaseType) => {
    return [DatabaseType.Salesforce_API, DatabaseType.ServiceNow_API, DatabaseType.Snowflake, DatabaseType.Databricks].includes(databaseType);
  };

  return {
    getAuthMethodOptions,
    isAWSProvider,
    isAzureProvider,
    isGoogleProvider,
    isSaaSProvider
  };
};