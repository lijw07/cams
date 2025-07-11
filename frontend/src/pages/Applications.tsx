import React, { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Edit, Trash2, ToggleLeft, ToggleRight, Database, Search } from 'lucide-react';
import { Application, ApplicationRequest, ApplicationWithConnectionRequest, PaginationRequest, PagedResult } from '../types';
import { applicationService } from '../services/applicationService';
import ApplicationModal from '../components/modals/ApplicationModal';
import ApplicationWithConnectionModal from '../components/modals/ApplicationWithConnectionModal';
import Pagination from '../components/common/Pagination';
import { useNotifications } from '../contexts/NotificationContext';
import { Link } from 'react-router-dom';

const Applications: React.FC = () => {
  const [pagedData, setPagedData] = useState<PagedResult<Application> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWithConnectionModalOpen, setIsWithConnectionModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [sortBy, setSortBy] = useState('Name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const { addNotification } = useNotifications();

  const fetchApplications = useCallback(async () => {
    try {
      setIsLoading(true);
      const pagination: PaginationRequest = {
        PageNumber: currentPage,
        PageSize: pageSize,
        SearchTerm: searchTerm || undefined,
        SortBy: sortBy,
        SortDirection: sortDirection
      };
      
      const data = await applicationService.getApplicationsPaginated(pagination);
      setPagedData(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      addNotification({ title: 'Error', message: 'Failed to load applications', type: 'error', source: 'Applications' });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, sortBy, sortDirection, addNotification]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to the first page when searching
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to the first page when sorting
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to the first page when changing page size
  };

  const handleUpdateApplication = async (data: ApplicationRequest) => {
    if (!selectedApplication) return;
    
    try {
      await applicationService.updateApplication(selectedApplication.Id, {
        ...data,
        Id: selectedApplication.Id
      });
      addNotification({ title: 'Success', message: 'Application updated successfully', type: 'success', source: 'Applications' });
      fetchApplications();
    } catch (error) {
      console.error('Error updating application:', error);
      addNotification({ title: 'Error', message: 'Failed to update application', type: 'error', source: 'Applications' });
      throw error;
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await applicationService.toggleApplicationStatus(id, !currentStatus);
      addNotification({ title: 'Success', message: `Application ${!currentStatus ? 'activated' : 'deactivated'} successfully`, type: 'success', source: 'Applications' });
      fetchApplications();
    } catch (error) {
      console.error('Error toggling application status:', error);
      addNotification({ title: 'Error', message: 'Failed to update application status', type: 'error', source: 'Applications' });
    }
  };

  const handleDeleteApplication = async (id: number) => {
    if (!confirm('Are you sure you want to delete this application?')) return;
    
    try {
      await applicationService.deleteApplication(id);
      addNotification({ title: 'Success', message: 'Application deleted successfully', type: 'success', source: 'Applications' });
      fetchApplications();
    } catch (error) {
      console.error('Error deleting application:', error);
      addNotification({ title: 'Error', message: 'Failed to delete application', type: 'error', source: 'Applications' });
    }
  };

  const openCreateModal = () => {
    setSelectedApplication(null);
    setIsWithConnectionModalOpen(true);
  };

  const handleCreateApplicationWithConnection = async (data: ApplicationWithConnectionRequest) => {
    try {
      const response = await applicationService.createApplicationWithConnection(data);
      addNotification({ title: 'Success', message: 'Application and connection created successfully', type: 'success', source: 'Applications' });
      if (response.ConnectionTestResult) {
        addNotification({ title: 'Success', message: 'Database connection test passed', type: 'success', source: 'Applications' });
      } else if (response.ConnectionTestMessage) {
        addNotification({ title: 'Error', message: `Connection test failed: ${response.ConnectionTestMessage}`, type: 'error', source: 'Applications' });
      }
      fetchApplications();
    } catch (error: any) {
      console.error('Error creating application with connection:', error);
      
      // Log detailed error information
      if (error.response?.data) {
        console.error('Backend validation errors:', error.response.data);
        console.error('Detailed errors object:', JSON.stringify(error.response.data.errors, null, 2));
        
        if (error.response.data.errors) {
          // Show specific validation errors
          const errorMessages = Object.entries(error.response.data.errors)
            .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
            .join('; ');
          addNotification({ 
            title: 'Validation Error', 
            message: errorMessages || 'Failed to create application with connection', 
            type: 'error', 
            source: 'Applications' 
          });
        } else {
          addNotification({ 
            title: 'Error', 
            message: error.response.data.message || error.response.data.title || 'Failed to create application with connection', 
            type: 'error', 
            source: 'Applications' 
          });
        }
      } else {
        addNotification({ title: 'Error', message: 'Failed to create application with connection', type: 'error', source: 'Applications' });
      }
      throw error;
    }
  };

  const openEditModal = async (application: Application) => {
    try {
      // Show loading state (optional - could add a loading indicator)
      setSelectedApplication(application);
      
      // Load application connections
      const connections = await applicationService.getApplicationConnections(application.Id);
      
      // Combine application data with connections
      const applicationWithConnections = {
        ...application,
        DatabaseConnections: connections
      };
      
      setSelectedApplication(applicationWithConnections);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error loading application connections:', error);
      // Still open the modal even if connections fail to load
      setSelectedApplication(application);
      setIsModalOpen(true);
      addNotification({
        title: 'Warning',
        message: 'Could not load database connections. You can still edit the application.',
        type: 'error',
        source: 'Applications'
      });
    }
  };


  const applications = pagedData?.Items || [];
  const totalCount = pagedData?.TotalCount || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Applications</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your applications and their configurations</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          New Application
        </button>
      </div>

      {/* Search and Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700 dark:text-gray-300">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => handleSort(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="Name">Name</option>
                <option value="CreatedAt">Created Date</option>
                <option value="UpdatedAt">Updated Date</option>
                <option value="Environment">Environment</option>
              </select>
              <button
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="px-2 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title={`Sort ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
              >
                {sortDirection === 'asc' ? '↑' : '↓'}
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700 dark:text-gray-300">Show:</label>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value={6}>6 per page</option>
                <option value={9}>9 per page</option>
                <option value={12}>12 per page</option>
                <option value={24}>24 per page</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading applications...</p>
          </div>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No matching applications' : 'No applications yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {searchTerm 
                ? `No applications found for "${searchTerm}". Try adjusting your search.`
                : 'Create your first application to get started with connection management.'
              }
            </p>
            {!searchTerm && (
              <button onClick={openCreateModal} className="btn btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Create Application
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {applications.map((app) => (
            <div key={app.Id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openEditModal(app)}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{app.Name}</h3>
                      <p className="text-sm text-gray-500">{app.Environment || 'Development'}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStatus(app.Id, app.IsActive);
                    }}
                    className="p-1 rounded-md hover:bg-gray-100"
                    title={app.IsActive ? 'Deactivate' : 'Activate'}
                  >
                    {app.IsActive ? (
                      <ToggleRight className="w-5 h-5 text-success-600" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>

                {app.Description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{app.Description}</p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>Version: {app.Version || 'N/A'}</span>
                  <span className={`badge ${app.IsActive ? 'badge-success' : 'badge-secondary'}`}>
                    {app.IsActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <Link
                    to={`/applications/${app.Id}`}
                    className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Database className="w-4 h-4 mr-1" />
                    {app.DatabaseConnectionCount} Connection{app.DatabaseConnectionCount !== 1 ? 's' : ''}
                  </Link>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(app);
                      }}
                      className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-700"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteApplication(app.Id);
                      }}
                      className="p-1 rounded-md text-gray-400 hover:text-error-600 hover:bg-error-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>

          {/* Pagination */}
          {pagedData && pagedData.TotalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={pagedData.TotalPages}
              totalItems={totalCount}
              pageSize={pageSize}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}

      <ApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleUpdateApplication}
        application={selectedApplication ? {
          ...selectedApplication,
          Name: selectedApplication.Name,
          Description: selectedApplication.Description,
          Version: selectedApplication.Version,
          Environment: selectedApplication.Environment,
          Tags: selectedApplication.Tags,
          IsActive: selectedApplication.IsActive,
          id: selectedApplication.Id, // Add lowercase id for the modal
          connections: selectedApplication.DatabaseConnections // Pass pre-loaded connections
        } : undefined}
        mode="edit"
      />

      <ApplicationWithConnectionModal
        isOpen={isWithConnectionModalOpen}
        onClose={() => setIsWithConnectionModalOpen(false)}
        onSubmit={handleCreateApplicationWithConnection}
      />

    </div>
  );
};

export default Applications;