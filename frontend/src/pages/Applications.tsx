import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, ToggleLeft, ToggleRight, Database } from 'lucide-react';
import { Application, ApplicationRequest, ApplicationWithConnectionRequest } from '../types';
import { applicationService } from '../services/applicationService';
import ApplicationModal from '../components/modals/ApplicationModal';
import ApplicationWithConnectionModal from '../components/modals/ApplicationWithConnectionModal';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const Applications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWithConnectionModalOpen, setIsWithConnectionModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const data = await applicationService.getApplications();
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  };

  // const handleCreateApplication = async (data: ApplicationRequest) => {
  //   try {
  //     await applicationService.createApplication(data);
  //     toast.success('Application created successfully');
  //     fetchApplications();
  //   } catch (error) {
  //     console.error('Error creating application:', error);
  //     toast.error('Failed to create application');
  //     throw error;
  //   }
  // };

  const handleUpdateApplication = async (data: ApplicationRequest) => {
    if (!selectedApplication) return;
    
    try {
      await applicationService.updateApplication(selectedApplication.id, {
        ...data,
        id: selectedApplication.id
      });
      toast.success('Application updated successfully');
      fetchApplications();
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error('Failed to update application');
      throw error;
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await applicationService.toggleApplicationStatus(id, !currentStatus);
      toast.success(`Application ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchApplications();
    } catch (error) {
      console.error('Error toggling application status:', error);
      toast.error('Failed to update application status');
    }
  };

  const handleDeleteApplication = async (id: number) => {
    if (!confirm('Are you sure you want to delete this application?')) return;
    
    try {
      await applicationService.deleteApplication(id);
      toast.success('Application deleted successfully');
      fetchApplications();
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error('Failed to delete application');
    }
  };

  const openCreateModal = () => {
    setSelectedApplication(null);
    setIsWithConnectionModalOpen(true);
  };

  const handleCreateApplicationWithConnection = async (data: ApplicationWithConnectionRequest) => {
    try {
      const response = await applicationService.createApplicationWithConnection(data);
      toast.success('Application and connection created successfully');
      if (response.connectionTestResult) {
        toast.success('Database connection test passed');
      } else if (response.connectionTestMessage) {
        toast.error(`Connection test failed: ${response.connectionTestMessage}`);
      }
      fetchApplications();
    } catch (error) {
      console.error('Error creating application with connection:', error);
      toast.error('Failed to create application with connection');
      throw error;
    }
  };

  const openEditModal = (application: Application) => {
    setSelectedApplication(application);
    setIsModalOpen(true);
  };


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
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No applications yet</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Create your first application to get started with connection management.
            </p>
            <button onClick={openCreateModal} className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create Application
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((app) => (
            <div key={app.id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{app.name}</h3>
                      <p className="text-sm text-gray-500">{app.environment || 'Development'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleStatus(app.id, app.isActive)}
                    className="p-1 rounded-md hover:bg-gray-100"
                    title={app.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {app.isActive ? (
                      <ToggleRight className="w-5 h-5 text-success-600" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>

                {app.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{app.description}</p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>Version: {app.version || 'N/A'}</span>
                  <span className={`badge ${app.isActive ? 'badge-success' : 'badge-secondary'}`}>
                    {app.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <Link
                    to={`/applications/${app.id}`}
                    className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                  >
                    <Database className="w-4 h-4 mr-1" />
                    {app.databaseConnectionCount} Connection{app.databaseConnectionCount !== 1 ? 's' : ''}
                  </Link>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal(app)}
                      className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-700"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteApplication(app.id)}
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
      )}

      <ApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleUpdateApplication}
        application={selectedApplication ? {
          ...selectedApplication,
          name: selectedApplication.name,
          description: selectedApplication.description,
          version: selectedApplication.version,
          environment: selectedApplication.environment,
          tags: selectedApplication.tags,
          isActive: selectedApplication.isActive
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