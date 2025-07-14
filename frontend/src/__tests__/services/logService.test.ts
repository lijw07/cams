import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logService } from '@/services/logService'
import { apiService as api } from '@/services/api'
import { 
  AuditLogFilters,
  SystemLogFilters,
  SecurityLogFilters,
  PerformanceLogFilters
} from '@/types'

// Mock dependencies
vi.mock('@/services/api')
vi.mock('@/types', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    mapPaginatedToLegacy: vi.fn((response) => ({
      ...response,
      logs: response.Items || [],
      total: response.TotalCount || 0
    }))
  }
})

// Get mock function
import { mapPaginatedToLegacy } from '@/types'

describe('logService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Mock window and document objects for export tests
    global.window.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    global.window.URL.revokeObjectURL = vi.fn()
    global.document.createElement = vi.fn(() => ({
      href: '',
      download: '',
      click: vi.fn(),
      style: {}
    }))
    global.document.body.appendChild = vi.fn()
    global.document.body.removeChild = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getAuditLogs', () => {
    it('should fetch audit logs with no filters', async () => {
      const mockResponse = {
        Items: [
          { Id: '1', Action: 'CREATE', EntityType: 'User' },
          { Id: '2', Action: 'UPDATE', EntityType: 'Application' }
        ],
        TotalCount: 2
      }
      
      ;(api.get as any).mockResolvedValue(mockResponse)
      
      const result = await logService.getAuditLogs()
      
      expect(api.get).toHaveBeenCalledWith('/logs/audit?')
      expect(mapPaginatedToLegacy).toHaveBeenCalledWith(mockResponse)
    })

    it('should fetch audit logs with all filters', async () => {
      const filters: AuditLogFilters = {
        page: 2,
        pageSize: 50,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        userId: 'user123',
        search: 'login',
        entityType: 'User',
        sortBy: 'Timestamp',
        sortDirection: 'desc'
      }
      
      const mockResponse = { Items: [], TotalCount: 0 }
      ;(api.get as any).mockResolvedValue(mockResponse)
      
      await logService.getAuditLogs(filters)
      
      expect(api.get).toHaveBeenCalledWith(
        '/logs/audit?page=2&page-size=50&from-date=2024-01-01&to-date=2024-01-31&user-id=user123&search=login&entity-type=User&sort-by=Timestamp&sort-direction=desc'
      )
    })

    it('should handle API errors', async () => {
      const error = new Error('API Error')
      ;(api.get as any).mockRejectedValue(error)
      
      await expect(logService.getAuditLogs()).rejects.toThrow('API Error')
      expect(console.error).toHaveBeenCalledWith('Error in getAuditLogs:', error)
    })
  })

  describe('getAuditLogById', () => {
    it('should fetch single audit log', async () => {
      const mockLog = {
        Id: '123',
        Action: 'CREATE',
        EntityType: 'Application',
        EntityId: '456',
        Timestamp: '2024-01-15T10:30:00Z'
      }
      
      ;(api.get as any).mockResolvedValue(mockLog)
      
      const result = await logService.getAuditLogById('123')
      
      expect(api.get).toHaveBeenCalledWith('/logs/audit/123')
      expect(result).toEqual(mockLog)
    })
  })

  describe('getSystemLogs', () => {
    it('should fetch system logs with filters', async () => {
      const filters: SystemLogFilters = {
        page: 1,
        pageSize: 25,
        level: 'ERROR',
        eventType: 'Application',
        isResolved: false,
        search: 'exception'
      }
      
      const mockResponse = { Items: [], TotalCount: 0 }
      ;(api.get as any).mockResolvedValue(mockResponse)
      
      await logService.getSystemLogs(filters)
      
      expect(api.get).toHaveBeenCalledWith(
        '/logs/system?page=1&page-size=25&level=ERROR&event-type=Application&search=exception&is-resolved=false'
      )
    })

    it('should handle undefined isResolved filter', async () => {
      const filters: SystemLogFilters = {
        page: 1,
        isResolved: undefined
      }
      
      ;(api.get as any).mockResolvedValue({ Items: [] })
      
      await logService.getSystemLogs(filters)
      
      expect(api.get).toHaveBeenCalledWith('/logs/system?page=1')
    })
  })

  describe('getSystemLogById', () => {
    it('should fetch single system log', async () => {
      const mockLog = { Id: '123', Level: 'ERROR', Message: 'System error' }
      
      ;(api.get as any).mockResolvedValue(mockLog)
      
      const result = await logService.getSystemLogById('123')
      
      expect(api.get).toHaveBeenCalledWith('/logs/system/123')
      expect(result).toEqual(mockLog)
    })
  })

  describe('markSystemLogResolved', () => {
    it('should mark system log as resolved', async () => {
      const mockResponse = {
        Id: '123',
        IsResolved: true,
        ResolutionNotes: 'Fixed the issue',
        ResolvedAt: '2024-01-20T15:00:00Z'
      }
      
      ;(api.patch as any).mockResolvedValue(mockResponse)
      
      const result = await logService.markSystemLogResolved('123', 'Fixed the issue')
      
      expect(api.patch).toHaveBeenCalledWith('/logs/system/123/resolve', {
        resolutionNotes: 'Fixed the issue'
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getSecurityLogs', () => {
    it('should fetch security logs with all filters', async () => {
      const filters: SecurityLogFilters = {
        page: 3,
        pageSize: 100,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        severity: 'HIGH',
        eventType: 'LoginFailure',
        status: 'Active',
        userId: 'user456',
        search: 'unauthorized',
        sortBy: 'Severity',
        sortDirection: 'asc'
      }
      
      const mockResponse = { Items: [], TotalCount: 0 }
      ;(api.get as any).mockResolvedValue(mockResponse)
      
      await logService.getSecurityLogs(filters)
      
      expect(api.get).toHaveBeenCalledWith(
        '/logs/security?page=3&page-size=100&from-date=2024-01-01&to-date=2024-01-31&severity=HIGH&event-type=LoginFailure&status=Active&user-id=user456&search=unauthorized&sort-by=Severity&sort-direction=asc'
      )
    })
  })

  describe('getSecurityLogById', () => {
    it('should fetch single security log', async () => {
      const mockLog = {
        Id: '123',
        EventType: 'UnauthorizedAccess',
        Severity: 'HIGH',
        IpAddress: '192.168.1.1'
      }
      
      ;(api.get as any).mockResolvedValue(mockLog)
      
      const result = await logService.getSecurityLogById('123')
      
      expect(api.get).toHaveBeenCalledWith('/logs/security/123')
      expect(result).toEqual(mockLog)
    })
  })

  describe('getPerformanceLogs', () => {
    it('should fetch performance logs with filters', async () => {
      const filters: PerformanceLogFilters = {
        page: 1,
        pageSize: 20,
        performanceLevel: 'SLOW',
        isSlowQuery: true,
        search: 'timeout'
      }
      
      const mockResponse = { Items: [], TotalCount: 0 }
      ;(api.get as any).mockResolvedValue(mockResponse)
      
      await logService.getPerformanceLogs(filters)
      
      expect(api.get).toHaveBeenCalledWith(
        '/logs/performance?page=1&page-size=20&performance-level=SLOW&search=timeout&is-slow-query=true'
      )
    })

    it('should handle undefined isSlowQuery filter', async () => {
      const filters: PerformanceLogFilters = {
        isSlowQuery: undefined
      }
      
      ;(api.get as any).mockResolvedValue({ Items: [] })
      
      await logService.getPerformanceLogs(filters)
      
      expect(api.get).toHaveBeenCalledWith('/logs/performance?')
    })
  })

  describe('getPerformanceLogById', () => {
    it('should fetch single performance log', async () => {
      const mockLog = {
        Id: '123',
        ExecutionTime: 5432,
        PerformanceLevel: 'SLOW',
        Query: 'SELECT * FROM large_table'
      }
      
      ;(api.get as any).mockResolvedValue(mockLog)
      
      const result = await logService.getPerformanceLogById('123')
      
      expect(api.get).toHaveBeenCalledWith('/logs/performance/123')
      expect(result).toEqual(mockLog)
    })
  })

  describe('getLogStatistics', () => {
    it('should fetch log statistics with default days', async () => {
      const mockStats = {
        totalCount: 1000,
        errorCount: 50,
        warningCount: 200,
        successCount: 750
      }
      
      ;(api.get as any).mockResolvedValue(mockStats)
      
      const result = await logService.getLogStatistics('audit')
      
      expect(api.get).toHaveBeenCalledWith('/logs/audit/statistics?days=7')
      expect(result).toEqual(mockStats)
    })

    it('should fetch log statistics with custom days', async () => {
      const mockStats = { totalCount: 5000 }
      
      ;(api.get as any).mockResolvedValue(mockStats)
      
      await logService.getLogStatistics('system', 30)
      
      expect(api.get).toHaveBeenCalledWith('/logs/system/statistics?days=30')
    })

    it('should handle all log types', async () => {
      const logTypes = ['audit', 'system', 'security', 'performance'] as const
      
      for (const logType of logTypes) {
        ;(api.get as any).mockResolvedValue({})
        await logService.getLogStatistics(logType, 14)
        expect(api.get).toHaveBeenCalledWith(`/logs/${logType}/statistics?days=14`)
      }
    })
  })

  describe('getLogTrends', () => {
    it('should fetch log trends with default days', async () => {
      const mockTrends = {
        daily: [
          { date: '2024-01-01', count: 100 },
          { date: '2024-01-02', count: 150 }
        ]
      }
      
      ;(api.get as any).mockResolvedValue(mockTrends)
      
      const result = await logService.getLogTrends('security')
      
      expect(api.get).toHaveBeenCalledWith('/logs/security/trends?days=30')
      expect(result).toEqual(mockTrends)
    })

    it('should fetch log trends with custom days', async () => {
      ;(api.get as any).mockResolvedValue({ daily: [] })
      
      await logService.getLogTrends('performance', 90)
      
      expect(api.get).toHaveBeenCalledWith('/logs/performance/trends?days=90')
    })
  })

  describe('exportLogs', () => {
    it('should export logs as CSV', async () => {
      const mockBlob = new Blob(['csv data'], { type: 'text/csv' })
      const mockResponse = { data: mockBlob }
      
      ;(api.client.get as any).mockResolvedValue(mockResponse)
      
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      }
      ;(document.createElement as any).mockReturnValue(mockLink)
      
      await logService.exportLogs('audit', { userId: '123' }, 'csv')
      
      expect(api.client.get).toHaveBeenCalledWith(
        '/logs/audit/export?userId=123&format=csv',
        { responseType: 'blob' }
      )
      
      expect(window.URL.createObjectURL).toHaveBeenCalled()
      expect(mockLink.download).toMatch(/^audit-logs-\d{4}-\d{2}-\d{2}\.csv$/)
      expect(mockLink.click).toHaveBeenCalled()
      expect(document.body.appendChild).toHaveBeenCalled()
      expect(document.body.removeChild).toHaveBeenCalled()
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    })

    it('should export logs as JSON', async () => {
      const mockBlob = new Blob(['{"logs": []}'], { type: 'application/json' })
      const mockResponse = { data: mockBlob }
      
      ;(api.client.get as any).mockResolvedValue(mockResponse)
      
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      }
      ;(document.createElement as any).mockReturnValue(mockLink)
      
      await logService.exportLogs('system', { level: 'ERROR' }, 'json')
      
      expect(api.client.get).toHaveBeenCalledWith(
        '/logs/system/export?level=ERROR&format=json',
        { responseType: 'blob' }
      )
      
      expect(mockLink.download).toMatch(/^system-logs-\d{4}-\d{2}-\d{2}\.json$/)
    })

    it('should handle empty filters', async () => {
      ;(api.client.get as any).mockResolvedValue({ data: new Blob() })
      ;(document.createElement as any).mockReturnValue({ click: vi.fn() })
      
      await logService.exportLogs('performance', {})
      
      expect(api.client.get).toHaveBeenCalledWith(
        '/logs/performance/export?format=csv',
        { responseType: 'blob' }
      )
    })
  })

  describe('error handling', () => {
    it('should log and rethrow errors for all log methods', async () => {
      const error = new Error('Network error')
      ;(api.get as any).mockRejectedValue(error)
      
      // Test each method
      await expect(logService.getAuditLogs()).rejects.toThrow('Network error')
      expect(console.error).toHaveBeenCalledWith('Error in getAuditLogs:', error)
      
      await expect(logService.getSystemLogs()).rejects.toThrow('Network error')
      expect(console.error).toHaveBeenCalledWith('Error in getSystemLogs:', error)
      
      await expect(logService.getSecurityLogs()).rejects.toThrow('Network error')
      expect(console.error).toHaveBeenCalledWith('Error in getSecurityLogs:', error)
      
      await expect(logService.getPerformanceLogs()).rejects.toThrow('Network error')
      expect(console.error).toHaveBeenCalledWith('Error in getPerformanceLogs:', error)
    })
  })

  describe('edge cases', () => {
    it('should handle special characters in search terms', async () => {
      const filters: AuditLogFilters = {
        search: 'test@example.com & "special chars"'
      }
      
      ;(api.get as any).mockResolvedValue({ Items: [] })
      
      await logService.getAuditLogs(filters)
      
      expect(api.get).toHaveBeenCalledWith(
        '/logs/audit?search=test%40example.com+%26+%22special+chars%22'
      )
    })

    it('should handle very large page numbers', async () => {
      const filters: SystemLogFilters = {
        page: 999999,
        pageSize: 1000
      }
      
      ;(api.get as any).mockResolvedValue({ Items: [] })
      
      await logService.getSystemLogs(filters)
      
      expect(api.get).toHaveBeenCalledWith('/logs/system?page=999999&page-size=1000')
    })

    it('should handle export with complex filters', async () => {
      const complexFilters = {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
        users: ['user1', 'user2', 'user3'],
        actions: ['CREATE', 'UPDATE', 'DELETE'],
        'special-key': 'special value'
      }
      
      ;(api.client.get as any).mockResolvedValue({ data: new Blob() })
      ;(document.createElement as any).mockReturnValue({ click: vi.fn() })
      
      await logService.exportLogs('audit', complexFilters)
      
      // URLSearchParams will serialize the object
      expect(api.client.get).toHaveBeenCalledWith(
        expect.stringContaining('/logs/audit/export?'),
        { responseType: 'blob' }
      )
    })
  })
})