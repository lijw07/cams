import { DatabaseType } from '../types';

/**
 * Database type classification utilities
 * Provides helper functions to categorize different database types
 */

interface DatabaseTypeInfo {
  isConnectionStringType: boolean;
  isCloudPlatform: boolean;
  isApiType: boolean;
}

/**
 * Get classification information for a database type
 * @param dbType - The database type to classify
 * @returns Object with boolean flags for different database categories
 */
export function getDatabaseTypeInfo(dbType: DatabaseType): DatabaseTypeInfo {
  const isConnectionStringType = dbType === DatabaseType.ConnectionString;
  const isCloudPlatform = [
    DatabaseType.AzureSQL,
    DatabaseType.AzureCosmosDB,
    DatabaseType.AWSRDS,
    DatabaseType.AWSRedshift,
    DatabaseType.AWSS3,
    DatabaseType.GCPBigQuery,
    DatabaseType.GCPCloudSQL,
    DatabaseType.GCPFirestore
  ].includes(dbType);
  const isApiType = dbType === DatabaseType.RestApi;

  return {
    isConnectionStringType,
    isCloudPlatform,
    isApiType
  };
}

/**
 * Check if a database type requires a connection string
 * @param dbType - Database type to check
 * @returns True if the type uses connection strings
 */
export function isConnectionStringType(dbType: DatabaseType): boolean {
  return dbType === DatabaseType.ConnectionString;
}

/**
 * Check if a database type is a cloud platform
 * @param dbType - Database type to check
 * @returns True if the type is a cloud platform database
 */
export function isCloudPlatform(dbType: DatabaseType): boolean {
  return [
    DatabaseType.AzureSQL,
    DatabaseType.AzureCosmosDB,
    DatabaseType.AWSRDS,
    DatabaseType.AWSRedshift,
    DatabaseType.AWSS3,
    DatabaseType.GCPBigQuery,
    DatabaseType.GCPCloudSQL,
    DatabaseType.GCPFirestore
  ].includes(dbType);
}

/**
 * Check if a database type is an API-based service
 * @param dbType - Database type to check  
 * @returns True if the type is API-based
 */
export function isApiType(dbType: DatabaseType): boolean {
  return dbType === DatabaseType.RestApi;
}

/**
 * Get the display name for a database type
 * @param dbType - Database type
 * @returns Human-readable display name
 */
export function getDatabaseTypeDisplayName(dbType: DatabaseType): string {
  const displayNames: Record<DatabaseType, string> = {
    [DatabaseType.SqlServer]: 'SQL Server',
    [DatabaseType.MySQL]: 'MySQL',
    [DatabaseType.PostgreSQL]: 'PostgreSQL',
    [DatabaseType.Oracle]: 'Oracle',
    [DatabaseType.SQLite]: 'SQLite',
    [DatabaseType.AzureSQL]: 'Azure SQL Database',
    [DatabaseType.AzureCosmosDB]: 'Azure Cosmos DB',
    [DatabaseType.AWSRDS]: 'AWS RDS',
    [DatabaseType.AWSRedshift]: 'AWS Redshift',
    [DatabaseType.AWSS3]: 'AWS S3',
    [DatabaseType.GCPBigQuery]: 'Google BigQuery',
    [DatabaseType.GCPCloudSQL]: 'Google Cloud SQL',
    [DatabaseType.GCPFirestore]: 'Google Firestore',
    [DatabaseType.RestApi]: 'REST API',
    [DatabaseType.ConnectionString]: 'Custom Connection String'
  };

  return displayNames[dbType] || dbType.toString();
}