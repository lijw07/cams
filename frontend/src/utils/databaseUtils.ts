import { DatabaseType } from '../types/database';

export interface DatabaseTypeOption {
  value: DatabaseType | string;
  label: string;
  isGroup?: boolean;
  isDisabled?: boolean;
}

export const getDatabaseTypeOptions = (): DatabaseTypeOption[] => [
  // Traditional Relational Databases
  { value: 'relational-group', label: '── Traditional Relational Databases ──', isGroup: true, isDisabled: true },
  { value: DatabaseType.SqlServer, label: 'SQL Server' },
  { value: DatabaseType.MySQL, label: 'MySQL' },
  { value: DatabaseType.PostgreSQL, label: 'PostgreSQL' },
  { value: DatabaseType.Oracle, label: 'Oracle' },
  { value: DatabaseType.SQLite, label: 'SQLite' },
  
  // NoSQL Databases
  { value: 'nosql-group', label: '── NoSQL Databases ──', isGroup: true, isDisabled: true },
  { value: DatabaseType.MongoDB, label: 'MongoDB' },
  { value: DatabaseType.Redis, label: 'Redis' },
  
  // API Types
  { value: 'api-group', label: '── API Types ──', isGroup: true, isDisabled: true },
  { value: DatabaseType.RestApi, label: 'REST API' },
  { value: DatabaseType.GraphQL, label: 'GraphQL' },
  { value: DatabaseType.WebSocket, label: 'WebSocket' },
  
  // Cloud Databases - AWS
  { value: 'aws-group', label: '── AWS Cloud Services ──', isGroup: true, isDisabled: true },
  { value: DatabaseType.AWS_RDS, label: 'AWS RDS' },
  { value: DatabaseType.AWS_DynamoDB, label: 'AWS DynamoDB' },
  { value: DatabaseType.AWS_S3, label: 'AWS S3' },
  
  // Cloud Databases - Azure
  { value: 'azure-group', label: '── Azure Cloud Services ──', isGroup: true, isDisabled: true },
  { value: DatabaseType.Azure_SQL, label: 'Azure SQL' },
  { value: DatabaseType.Azure_CosmosDB, label: 'Azure CosmosDB' },
  { value: DatabaseType.Azure_Storage, label: 'Azure Storage' },
  
  // Cloud Databases - Google Cloud
  { value: 'gcp-group', label: '── Google Cloud Services ──', isGroup: true, isDisabled: true },
  { value: DatabaseType.Google_CloudSQL, label: 'Google Cloud SQL' },
  { value: DatabaseType.Google_Firestore, label: 'Google Firestore' },
  { value: DatabaseType.Google_BigQuery, label: 'Google BigQuery' },
  
  // Data Warehouses & Analytics
  { value: 'analytics-group', label: '── Data Warehouses & Analytics ──', isGroup: true, isDisabled: true },
  { value: DatabaseType.Snowflake, label: 'Snowflake' },
  { value: DatabaseType.Databricks, label: 'Databricks' },
  
  // SaaS & External APIs
  { value: 'saas-group', label: '── SaaS & External APIs ──', isGroup: true, isDisabled: true },
  { value: DatabaseType.Salesforce_API, label: 'Salesforce API' },
  { value: DatabaseType.ServiceNow_API, label: 'ServiceNow API' },
  { value: DatabaseType.GitHub_API, label: 'GitHub API' },
  
  // Custom/Other
  { value: 'custom-group', label: '── Custom/Other ──', isGroup: true, isDisabled: true },
  { value: DatabaseType.Custom, label: 'Custom' }
];

export const getDatabaseTypeName = (type: DatabaseType): string => {
  const option = getDatabaseTypeOptions().find(opt => opt.value === type && !opt.isGroup);
  return option?.label || 'Unknown';
};

export const isApiType = (type: DatabaseType): boolean => {
  return [
    DatabaseType.RestApi,
    DatabaseType.GraphQL,
    DatabaseType.WebSocket,
    DatabaseType.GitHub_API,
    DatabaseType.Salesforce_API,
    DatabaseType.ServiceNow_API
  ].includes(type);
};

export const isCloudDatabase = (type: DatabaseType): boolean => {
  return [
    DatabaseType.AWS_RDS,
    DatabaseType.AWS_DynamoDB,
    DatabaseType.AWS_S3,
    DatabaseType.Azure_SQL,
    DatabaseType.Azure_CosmosDB,
    DatabaseType.Azure_Storage,
    DatabaseType.Google_CloudSQL,
    DatabaseType.Google_Firestore,
    DatabaseType.Google_BigQuery
  ].includes(type);
};

export const isConnectionStringType = (type: DatabaseType): boolean => {
  return type === DatabaseType.Custom;
};

export const isCloudPlatform = (type: DatabaseType): boolean => {
  return isCloudDatabase(type) || [
    DatabaseType.Snowflake,
    DatabaseType.Databricks
  ].includes(type);
};

export const getDefaultPort = (type: DatabaseType): number | undefined => {
  switch (type) {
    case DatabaseType.SqlServer:
      return 1433;
    case DatabaseType.MySQL:
      return 3306;
    case DatabaseType.PostgreSQL:
      return 5432;
    case DatabaseType.Oracle:
      return 1521;
    case DatabaseType.MongoDB:
      return 27017;
    case DatabaseType.Redis:
      return 6379;
    default:
      return undefined;
  }
};