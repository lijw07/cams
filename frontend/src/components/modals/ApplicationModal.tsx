import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Database, Server, Plus, Trash2, ToggleLeft, ToggleRight, Edit } from 'lucide-react';
import { ApplicationRequest, DatabaseConnectionRequest, DatabaseConnectionUpdateRequest, DatabaseConnection } from '../../types';
import { databaseConnectionService } from '../../services/databaseConnectionService';
import DatabaseConnectionModal from './DatabaseConnectionModal';
import { useNotifications } from '../../contexts/NotificationContext';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ApplicationRequest) => Promise<void>;
  application?: ApplicationRequest & { id?: number; connections?: DatabaseConnection[] };
  mode?: 'create' | 'edit';
}

const ApplicationModal: React.FC<ApplicationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  application,
  mode = 'create'
}) => {
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [isConnectionFormOpen, setIsConnectionFormOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<DatabaseConnection | null>(null);
  const { addNotification } = useNotifications();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ApplicationRequest>({
    defaultValues: {
      Name: '',
      Description: '',
      Version: '',
      Environment: 'Development',
      Tags: '',
      IsActive: true
    }
  });

  // Load connections when editing an existing application
  useEffect(() => {
    if (mode === 'edit' && isOpen) {
      // Use pre-loaded connections if available, otherwise fetch them
      if (application?.connections) {
        setConnections(application.connections);
      } else if (application?.id) {
        loadConnections();
      }
    }
  }, [mode, application?.id, application?.connections, isOpen]);

  const loadConnections = async () => {
    const appId = application?.id;
    if (!appId) return;
    try {
      const connectionData = await databaseConnectionService.getConnections(appId);
      setConnections(connectionData);
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  useEffect(() => {
    if (application) {
      reset(application);
    } else {
      reset({
        Name: '',
        Description: '',
        Version: '',
        Environment: 'Development',
        Tags: '',
        IsActive: true
      });
    }
  }, [application, reset]);

  const handleFormSubmit = async (data: ApplicationRequest) => {
    try {
      await onSubmit(data);
      reset();
      onClose();
    } catch (error) {
      console.error('Error submitting application:', error);
    }
  };

  const handleDeleteConnection = async (connectionId: number) => {
    if (!confirm('Are you sure you want to delete this connection?')) return;
    
    try {
      await databaseConnectionService.deleteConnection(connectionId);
      addNotification({
        title: 'Connection Deleted',
        message: 'Connection deleted successfully',
        type: 'success',
        source: 'Database Connection'
      });
      loadConnections();
    } catch (error) {
      console.error('Error deleting connection:', error);
      addNotification({
        title: 'Delete Failed',
        message: 'Failed to delete connection',
        type: 'error',
        source: 'Database Connection'
      });
    }
  };

  const toggleConnectionStatus = async (connectionId: number, currentStatus: boolean) => {
    try {
      await databaseConnectionService.toggleConnectionStatus(connectionId, !currentStatus);
      addNotification({
        title: 'Connection Updated',
        message: `Connection ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
        type: 'success',
        source: 'Database Connection'
      });
      loadConnections();
    } catch (error) {
      console.error('Error toggling connection status:', error);
      addNotification({
        title: 'Update Failed',
        message: 'Failed to update connection status',
        type: 'error',
        source: 'Database Connection'
      });
    }
  };

  const handleEditConnection = (connection: DatabaseConnection) => {
    setEditingConnection(connection);
    setIsConnectionFormOpen(true);
  };

  const handleCloseConnectionModal = () => {
    setIsConnectionFormOpen(false);
    setEditingConnection(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {mode === 'create' ? 'Create New Application' : 'Edit Application'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Application Form */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Server className="w-5 h-5 mr-2" />
                Application Details
              </h3>
              
              <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                <div>
                  <label htmlFor="Name" className="label">
                    Application Name *
                  </label>
                  <input
                    {...register('Name', {
                      required: 'Application name is required',
                      minLength: {
                        value: 3,
                        message: 'Name must be at least 3 characters'
                      }
                    })}
                    type="text"
                    id="Name"
                    className="input"
                    placeholder="e.g., E-commerce API"
                  />
                  {errors.Name && (
                    <p className="mt-1 text-sm text-error-600">{errors.Name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="Description" className="label">
                    Description
                  </label>
                  <textarea
                    {...register('Description')}
                    id="Description"
                    rows={3}
                    className="input"
                    placeholder="Brief description of the application"
                  />
                </div>

                <div>
                  <label htmlFor="Version" className="label">
                    Version
                  </label>
                  <input
                    {...register('Version')}
                    type="text"
                    id="Version"
                    className="input"
                    placeholder="e.g., 1.0.0"
                  />
                </div>

                <div>
                  <label htmlFor="Environment" className="label">
                    Environment
                  </label>
                  <select
                    {...register('Environment')}
                    id="Environment"
                    className="input"
                  >
                    <option value="Development">Development</option>
                    <option value="Staging">Staging</option>
                    <option value="Production">Production</option>
                    <option value="Testing">Testing</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="Tags" className="label">
                    Tags
                  </label>
                  <input
                    {...register('Tags')}
                    type="text"
                    id="Tags"
                    className="input"
                    placeholder="e.g., api, microservice, backend (comma-separated)"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Separate multiple tags with commas
                  </p>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center">
                    <input
                      {...register('IsActive')}
                      type="checkbox"
                      id="IsActive"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="IsActive" className="ml-2 block text-sm font-medium text-gray-900">
                      Active Application
                    </label>
                  </div>
                  <span className="text-xs text-gray-500">
                    Application will be available for use when active
                  </span>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Application' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* Database Connections Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  Database Connections
                </h3>
                <button
                  type="button"
                  onClick={() => setIsConnectionFormOpen(true)}
                  className="btn btn-primary btn-sm"
                  disabled={mode === 'create'}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Connection
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {mode === 'create' ? (
                  <div className="text-center py-8 text-gray-500">
                    <Database className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Create the application first</p>
                    <p className="text-sm">You can add connections after creating the application</p>
                  </div>
                ) : connections.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Database className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No database connections yet</p>
                    <p className="text-sm">Click "Add Connection" to create one</p>
                  </div>
                ) : (
                  connections.map((connection) => (
                    <div key={connection.Id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-gray-900">{connection.Name}</h4>
                            <span className={`badge ${connection.IsActive ? 'badge-success' : 'badge-secondary'}`}>
                              {connection.IsActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{connection.TypeName}</p>
                          {connection.Description && (
                            <p className="text-sm text-gray-500 mb-2">{connection.Description}</p>
                          )}
                          <div className="text-xs text-gray-400">
                            Created: {new Date(connection.CreatedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => handleEditConnection(connection)}
                            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleConnectionStatus(connection.Id, connection.IsActive)}
                            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            title={connection.IsActive ? 'Deactivate' : 'Activate'}
                          >
                            {connection.IsActive ? (
                              <ToggleRight className="w-4 h-4 text-success-600" />
                            ) : (
                              <ToggleLeft className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteConnection(connection.Id)}
                            className="p-1 rounded-md text-gray-400 hover:text-error-600 hover:bg-error-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Database Connection Modal */}
          {isConnectionFormOpen && mode === 'edit' && application?.id && (
            <DatabaseConnectionModal
              isOpen={isConnectionFormOpen}
              onClose={handleCloseConnectionModal}
              onSubmit={async (data: DatabaseConnectionRequest | DatabaseConnectionUpdateRequest) => {
                try {
                  if (editingConnection) {
                    // Edit mode
                    await databaseConnectionService.updateConnection(editingConnection.Id, data as DatabaseConnectionUpdateRequest);
                    addNotification({
                      title: 'Connection Updated',
                      message: 'Database connection updated successfully',
                      type: 'success',
                      source: 'Database Connection'
                    });
                  } else {
                    // Create mode
                    await databaseConnectionService.createConnection(data as DatabaseConnectionRequest);
                    addNotification({
                      title: 'Connection Created',
                      message: 'Database connection created successfully',
                      type: 'success',
                      source: 'Database Connection'
                    });
                  }
                  loadConnections();
                  handleCloseConnectionModal();
                } catch (error) {
                  console.error('Error saving connection:', error);
                  addNotification({
                    title: editingConnection ? 'Update Failed' : 'Creation Failed',
                    message: `Failed to ${editingConnection ? 'update' : 'create'} database connection`,
                    type: 'error',
                    source: 'Database Connection'
                  });
                  throw error;
                }
              }}
              applicationId={application.id}
              applicationName={application.Name}
              connection={editingConnection || undefined}
              mode={editingConnection ? 'edit' : 'create'}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationModal;