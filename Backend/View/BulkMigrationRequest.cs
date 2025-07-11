using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View
{
    public class BulkMigrationRequest
    {
        [Required(ErrorMessage = "Migration type is required")]
        public string MigrationType { get; set; } = string.Empty;

        [Required(ErrorMessage = "Data is required")]
        public string Data { get; set; } = string.Empty;

        public string DataFormat { get; set; } = "JSON";

        public bool ValidateOnly { get; set; } = false;

        public bool OverwriteExisting { get; set; } = false;

        public bool SendNotifications { get; set; } = true;
    }
}