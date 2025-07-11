namespace cams.Backend.Enums
{
    public enum DatabaseType
    {
        SqlServer = 1,
        MySQL = 2,
        PostgreSQL = 3,
        Oracle = 4,
        SQLite = 5,
        MongoDB = 6,
        Redis = 7,
        RestApi = 8,
        GraphQL = 9,
        WebSocket = 10,
        // Cloud Platforms
        AWS_RDS = 11,
        AWS_DynamoDB = 12,
        AWS_S3 = 13,
        Azure_SQL = 14,
        Azure_CosmosDB = 15,
        Azure_Storage = 16,
        Google_CloudSQL = 17,
        Google_Firestore = 18,
        Google_BigQuery = 19,
        Salesforce_API = 20,
        ServiceNow_API = 21,
        Snowflake = 22,
        Databricks = 23,
        Custom = 99
    }
}