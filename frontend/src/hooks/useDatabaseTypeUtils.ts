import { useMemo } from 'react';

import { DatabaseType } from '../types';

/**
 * Hook for database type utilities and classification
 * Provides type checking functions and option lists
 */
export const useDatabaseTypeUtils = (selectedDbType?: DatabaseType) => {
  // Memoize database type options to prevent recreation
  const databaseTypeOptions = useMemo(() => [
    { value: DatabaseType.SqlServer, label: 'SQL Server' },
    { value: DatabaseType.MySQL, label: 'MySQL' },
    { value: DatabaseType.PostgreSQL, label: 'PostgreSQL' },
    { value: DatabaseType.Oracle, label: 'Oracle' },
    { value: DatabaseType.SQLite, label: 'SQLite' },
    { value: DatabaseType.MongoDB, label: 'MongoDB' },
    { value: DatabaseType.Redis, label: 'Redis' },
    { value: DatabaseType.RestApi, label: 'REST API' },
    { value: DatabaseType.GraphQL, label: 'GraphQL' },
    { value: DatabaseType.WebSocket, label: 'WebSocket' },
    { value: DatabaseType.AWS_RDS, label: 'AWS RDS' },
    { value: DatabaseType.AWS_DynamoDB, label: 'AWS DynamoDB' },
    { value: DatabaseType.AWS_S3, label: 'AWS S3' },
    { value: DatabaseType.Azure_SQL, label: 'Azure SQL' },
    { value: DatabaseType.Azure_CosmosDB, label: 'Azure Cosmos DB' },
    { value: DatabaseType.Azure_Storage, label: 'Azure Storage' },
    { value: DatabaseType.Google_CloudSQL, label: 'Google Cloud SQL' },
    { value: DatabaseType.Google_Firestore, label: 'Google Firestore' },
    { value: DatabaseType.Google_BigQuery, label: 'Google BigQuery' },
    { value: DatabaseType.Salesforce_API, label: 'Salesforce' },
    { value: DatabaseType.ServiceNow_API, label: 'ServiceNow' },
    { value: DatabaseType.Snowflake, label: 'Snowflake' },
    { value: DatabaseType.Databricks, label: 'Databricks' },
    { value: DatabaseType.Custom, label: 'Custom' }
  ], []);

  // Memoize type classification functions
  const isApiType = useMemo(() => {
    if (!selectedDbType) return false;
    return [
      DatabaseType.RestApi, 
      DatabaseType.GraphQL, 
      DatabaseType.WebSocket,
      DatabaseType.Salesforce_API,
      DatabaseType.ServiceNow_API
    ].includes(selectedDbType);
  }, [selectedDbType]);

  const isConnectionStringType = useMemo(() => {
    if (!selectedDbType) return false;
    return [DatabaseType.Custom].includes(selectedDbType);
  }, [selectedDbType]);

  const isCloudPlatform = useMemo(() => {
    if (!selectedDbType) return false;
    return selectedDbType >= DatabaseType.AWS_RDS && selectedDbType <= DatabaseType.Databricks;
  }, [selectedDbType]);

  const isTraditionalDatabase = useMemo(() => {
    if (!selectedDbType) return false;
    return [
      DatabaseType.SqlServer,
      DatabaseType.MySQL,
      DatabaseType.PostgreSQL,
      DatabaseType.Oracle,
      DatabaseType.SQLite
    ].includes(selectedDbType);
  }, [selectedDbType]);

  const isNoSqlDatabase = useMemo(() => {
    if (!selectedDbType) return false;
    return [
      DatabaseType.MongoDB,
      DatabaseType.Redis
    ].includes(selectedDbType);
  }, [selectedDbType]);

  return {
    databaseTypeOptions,
    isApiType,
    isConnectionStringType,
    isCloudPlatform,
    isTraditionalDatabase,
    isNoSqlDatabase
  };
};