namespace cams.Backend.Enums
{
    public enum DatabaseType
    {
        // Traditional Relational Databases (1-10)
        SqlServer = 1,
        MySQL = 2,
        PostgreSQL = 3,
        Oracle = 4,
        SQLite = 5,
        
        // NoSQL Databases (11-20)
        MongoDB = 11,
        Redis = 12,
        
        // API Types (21-30)
        RestApi = 21,
        GraphQL = 22,
        WebSocket = 23,
        
        // Cloud Databases - AWS (31-40)
        AWS_RDS = 31,
        AWS_DynamoDB = 32,
        AWS_S3 = 33,
        
        // Cloud Databases - Azure (41-50)
        Azure_SQL = 41,
        Azure_CosmosDB = 42,
        Azure_Storage = 43,
        
        // Cloud Databases - Google Cloud (51-60)
        Google_CloudSQL = 51,
        Google_Firestore = 52,
        Google_BigQuery = 53,
        
        // Data Warehouses & Analytics (61-70)
        Snowflake = 61,
        Databricks = 62,
        
        // SaaS & External APIs (71-80)
        Salesforce_API = 71,
        ServiceNow_API = 72,
        GitHub_API = 73,
        
        // Custom/Other (99)
        Custom = 99
    }
}