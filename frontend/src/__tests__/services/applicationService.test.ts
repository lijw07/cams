import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { applicationService } from '@/services/applicationService'
import { apiService } from '@/services/api'
import { 
  Application, 
  ApplicationRequest, 
  ApplicationWithConnectionRequest,
  PaginationRequest 
} from '@/types'

// Mock dependencies
vi.mock('@/services/api')

describe('applicationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getApplications', () => {
    it('should fetch all applications', async () => {
      const mockApplications: Application[] = [
        {
          Id: '1',
          Name: 'App 1',
          Description: 'Description 1',
          Version: '1.0.0',
          Environment: 'Production',
          Tags: 'tag1,tag2',
          IsActive: true,
          CreatedDate: '2024-01-01',
          LastModifiedDate: '2024-01-15',
          LastAccessedDate: '2024-01-20'
        },
        {
          Id: '2',
          Name: 'App 2',
          Description: 'Description 2',
          Version: '2.0.0',
          Environment: 'Development',
          Tags: 'tag3',
          IsActive: false,
          CreatedDate: '2024-01-02',
          LastModifiedDate: '2024-01-16',
          LastAccessedDate: '2024-01-21'
        }
      ]
      
      ;(apiService.get as any).mockResolvedValue(mockApplications)
      
      const result = await applicationService.getApplications()
      
      expect(apiService.get).toHaveBeenCalledWith('/applications')
      expect(result).toEqual(mockApplications)
    })

    it('should handle empty application list', async () => {
      ;(apiService.get as any).mockResolvedValue([])
      
      const result = await applicationService.getApplications()
      
      expect(result).toEqual([])
    })
  })

  describe('getApplicationsPaginated', () => {
    it('should fetch paginated applications with all parameters', async () => {
      const pagination: PaginationRequest = {
        PageNumber: 2,
        PageSize: 20,
        SearchTerm: 'test',
        SortBy: 'Name',
        SortDirection: 'desc'
      }
      
      const mockResponse = {
        Items: [{ Id: '1', Name: 'Test App' }],
        TotalCount: 100,
        PageNumber: 2,
        PageSize: 20,
        TotalPages: 5
      }
      
      ;(apiService.get as any).mockResolvedValue(mockResponse)
      
      const result = await applicationService.getApplicationsPaginated(pagination)
      
      expect(apiService.get).toHaveBeenCalledWith(
        '/applications?page-number=2&page-size=20&search-term=test&sort-by=Name&sort-direction=desc'
      )
      expect(result).toEqual(mockResponse)
    })

    it('should handle partial pagination parameters', async () => {
      const pagination: PaginationRequest = {
        PageNumber: 1,
        PageSize: 10
      }
      
      ;(apiService.get as any).mockResolvedValue({ Items: [], TotalCount: 0 })
      
      await applicationService.getApplicationsPaginated(pagination)
      
      expect(apiService.get).toHaveBeenCalledWith(
        '/applications?page-number=1&page-size=10'
      )
    })

    it('should handle empty pagination parameters', async () => {
      const pagination: PaginationRequest = {}
      
      ;(apiService.get as any).mockResolvedValue({ Items: [], TotalCount: 0 })
      
      await applicationService.getApplicationsPaginated(pagination)
      
      expect(apiService.get).toHaveBeenCalledWith('/applications')
    })
  })

  describe('getApplication', () => {
    it('should fetch single application by id', async () => {
      const mockApplication = {
        Id: '123',
        Name: 'Test App',
        Description: 'Test Description',
        IsActive: true
      }
      
      ;(apiService.get as any).mockResolvedValue(mockApplication)
      
      const result = await applicationService.getApplication('123')
      
      expect(apiService.get).toHaveBeenCalledWith('/applications/123')
      expect(result).toEqual(mockApplication)
    })
  })

  describe('createApplication', () => {
    it('should create application', async () => {
      const applicationData: ApplicationRequest = {
        Name: 'New App',
        Description: 'New Description',
        Version: '1.0.0',
        Environment: 'Development',
        Tags: 'new,app',
        IsActive: true
      }
      
      const mockResponse = {
        Id: '456',
        ...applicationData,
        CreatedDate: '2024-01-01'
      }
      
      ;(apiService.post as any).mockResolvedValue(mockResponse)
      
      const result = await applicationService.createApplication(applicationData)
      
      expect(apiService.post).toHaveBeenCalledWith('/applications', applicationData)
      expect(result).toEqual(mockResponse)
    })

    it('should handle minimal application data', async () => {
      const applicationData: ApplicationRequest = {
        Name: 'Minimal App',
        IsActive: true
      }
      
      ;(apiService.post as any).mockResolvedValue({ Id: '789', ...applicationData })
      
      await applicationService.createApplication(applicationData)
      
      expect(apiService.post).toHaveBeenCalledWith('/applications', applicationData)
    })
  })

  describe('updateApplication', () => {
    it('should update application', async () => {
      const updateData = {
        Id: '123',
        Name: 'Updated App',
        Description: 'Updated Description',
        Version: '2.0.0',
        Environment: 'Production',
        Tags: 'updated',
        IsActive: true
      }
      
      const mockResponse = {
        ...updateData,
        LastModifiedDate: '2024-01-20'
      }
      
      ;(apiService.put as any).mockResolvedValue(mockResponse)
      
      const result = await applicationService.updateApplication('123', updateData)
      
      expect(apiService.put).toHaveBeenCalledWith('/applications/123', updateData)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('deleteApplication', () => {
    it('should delete application', async () => {
      ;(apiService.delete as any).mockResolvedValue(undefined)
      
      await applicationService.deleteApplication('123')
      
      expect(apiService.delete).toHaveBeenCalledWith('/applications/123')
    })
  })

  describe('toggleApplicationStatus', () => {
    it('should toggle application status to active', async () => {
      const mockResponse = { message: 'Application activated successfully' }
      
      ;(apiService.patch as any).mockResolvedValue(mockResponse)
      
      const result = await applicationService.toggleApplicationStatus('123', true)
      
      expect(apiService.patch).toHaveBeenCalledWith('/applications/123/toggle', { IsActive: true })
      expect(result).toEqual(mockResponse)
    })

    it('should toggle application status to inactive', async () => {
      const mockResponse = { message: 'Application deactivated successfully' }
      
      ;(apiService.patch as any).mockResolvedValue(mockResponse)
      
      const result = await applicationService.toggleApplicationStatus('123', false)
      
      expect(apiService.patch).toHaveBeenCalledWith('/applications/123/toggle', { IsActive: false })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('updateLastAccessed', () => {
    it('should update last accessed timestamp', async () => {
      const mockResponse = { message: 'Last accessed time updated' }
      
      ;(apiService.post as any).mockResolvedValue(mockResponse)
      
      const result = await applicationService.updateLastAccessed('123')
      
      expect(apiService.post).toHaveBeenCalledWith('/applications/123/access')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getApplicationConnections', () => {
    it('should fetch application connections', async () => {
      const mockConnections = [
        {
          Id: 'conn1',
          Name: 'Primary DB',
          DatabaseType: 'SqlServer',
          IsPrimary: true
        },
        {
          Id: 'conn2',
          Name: 'Secondary DB',
          DatabaseType: 'PostgreSQL',
          IsPrimary: false
        }
      ]
      
      ;(apiService.get as any).mockResolvedValue(mockConnections)
      
      const result = await applicationService.getApplicationConnections('123')
      
      expect(apiService.get).toHaveBeenCalledWith('/applications/123/connections')
      expect(result).toEqual(mockConnections)
    })

    it('should handle no connections', async () => {
      ;(apiService.get as any).mockResolvedValue([])
      
      const result = await applicationService.getApplicationConnections('123')
      
      expect(result).toEqual([])
    })
  })

  describe('createApplicationWithConnection', () => {
    it('should create application with connection', async () => {
      const requestData: ApplicationWithConnectionRequest = {
        Application: {
          Name: 'App with Connection',
          Description: 'Test',
          IsActive: true
        },
        Connection: {
          Name: 'Primary Connection',
          DatabaseType: 'SqlServer',
          Server: 'localhost',
          Database: 'testdb',
          Port: 1433,
          Username: 'sa',
          Password: 'password',
          IsPrimary: true
        }
      }
      
      const mockResponse = {
        Application: {
          Id: '123',
          ...requestData.Application
        },
        Connection: {
          Id: 'conn123',
          ...requestData.Connection
        }
      }
      
      ;(apiService.post as any).mockResolvedValue(mockResponse)
      
      const result = await applicationService.createApplicationWithConnection(requestData)
      
      expect(console.log).toHaveBeenCalledWith('API Request data:', requestData)
      expect(apiService.post).toHaveBeenCalledWith('/applications/with-connection', requestData)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('updateApplicationWithConnection', () => {
    it('should update application with connection', async () => {
      const updateData = {
        ApplicationId: '123',
        ConnectionId: 'conn123',
        Application: {
          Name: 'Updated App',
          IsActive: true
        },
        Connection: {
          Name: 'Updated Connection',
          DatabaseType: 'PostgreSQL' as const,
          Server: 'new-server'
        }
      }
      
      const mockResponse = {
        Application: {
          Id: '123',
          Name: 'Updated App'
        },
        Connection: {
          Id: 'conn123',
          Name: 'Updated Connection'
        }
      }
      
      ;(apiService.put as any).mockResolvedValue(mockResponse)
      
      const result = await applicationService.updateApplicationWithConnection('123', updateData)
      
      expect(apiService.put).toHaveBeenCalledWith('/applications/123/with-connection', updateData)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getApplicationWithPrimaryConnection', () => {
    it('should fetch application with primary connection', async () => {
      const mockResponse = {
        Application: {
          Id: '123',
          Name: 'Test App',
          IsActive: true
        },
        Connection: {
          Id: 'conn123',
          Name: 'Primary DB',
          DatabaseType: 'SqlServer',
          IsPrimary: true
        }
      }
      
      ;(apiService.get as any).mockResolvedValue(mockResponse)
      
      const result = await applicationService.getApplicationWithPrimaryConnection('123')
      
      expect(apiService.get).toHaveBeenCalledWith('/applications/123/with-primary-connection')
      expect(result).toEqual(mockResponse)
    })

    it('should handle application without primary connection', async () => {
      const mockResponse = {
        Application: {
          Id: '123',
          Name: 'Test App'
        },
        Connection: null
      }
      
      ;(apiService.get as any).mockResolvedValue(mockResponse)
      
      const result = await applicationService.getApplicationWithPrimaryConnection('123')
      
      expect(result.Connection).toBeNull()
    })
  })

  describe('error handling', () => {
    it('should propagate API errors', async () => {
      const mockError = {
        Code: 'NOT_FOUND',
        Message: 'Application not found'
      }
      
      ;(apiService.get as any).mockRejectedValue(mockError)
      
      await expect(applicationService.getApplication('999')).rejects.toEqual(mockError)
    })

    it('should handle network errors', async () => {
      const networkError = new Error('Network timeout')
      
      ;(apiService.post as any).mockRejectedValue(networkError)
      
      await expect(
        applicationService.createApplication({ Name: 'Test', IsActive: true })
      ).rejects.toThrow('Network timeout')
    })
  })

  describe('edge cases', () => {
    it('should handle special characters in IDs', async () => {
      const specialId = 'app-123_test.special'
      
      ;(apiService.get as any).mockResolvedValue({ Id: specialId })
      
      await applicationService.getApplication(specialId)
      
      expect(apiService.get).toHaveBeenCalledWith(`/applications/${specialId}`)
    })

    it('should handle very long search terms', async () => {
      const longSearchTerm = 'a'.repeat(1000)
      
      ;(apiService.get as any).mockResolvedValue({ Items: [] })
      
      await applicationService.getApplicationsPaginated({
        SearchTerm: longSearchTerm
      })
      
      expect(apiService.get).toHaveBeenCalledWith(
        `/applications?search-term=${longSearchTerm}`
      )
    })

    it('should handle null/undefined values in responses', async () => {
      ;(apiService.get as any).mockResolvedValue(null)
      
      const result = await applicationService.getApplications()
      
      expect(result).toBeNull()
    })
  })
})