namespace cams.Backend.Enums
{
    public enum SystemEventType
    {
        ApplicationStart,
        ApplicationStop,
        DatabaseConnection,
        DatabaseError,
        ApiRequest,
        ApiResponse,
        ConfigurationChange,
        ServiceStartup,
        ServiceShutdown,
        HealthCheck,
        BackgroundJob,
        ExternalServiceCall,
        CacheOperation,
        FileOperation,
        EmailSent,
        DataMigration,
        PerformanceAlert
    }
}