using cams.Backend.Model;
using cams.Backend.View;

namespace cams.Backend.Services
{
    public interface IConnectionStringBuilder
    {
        string GetConnectionString(DatabaseConnection? connection, DatabaseConnectionRequest? connectionDetails);
    }
}