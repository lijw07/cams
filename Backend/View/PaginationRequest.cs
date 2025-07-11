using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;

namespace cams.Backend.View
{
    public class PaginationRequest
    {
        [Range(1, int.MaxValue)]
        [FromQuery(Name = "page-number")]
        public int PageNumber { get; set; } = 1;
        
        [Range(1, 100)]
        [FromQuery(Name = "page-size")]
        public int PageSize { get; set; } = 10;
        
        [FromQuery(Name = "search-term")]
        public string? SearchTerm { get; set; }
        
        [FromQuery(Name = "sort-by")]
        public string? SortBy { get; set; }
        
        [FromQuery(Name = "sort-direction")]
        public string? SortDirection { get; set; } = "asc";
    }
}