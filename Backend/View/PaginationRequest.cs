using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View
{
    public class PaginationRequest
    {
        [Range(1, int.MaxValue)]
        public int PageNumber { get; set; } = 1;
        
        [Range(1, 100)]
        public int PageSize { get; set; } = 10;
        
        public string? SearchTerm { get; set; }
    }
}