import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Database, Server, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { ApplicationRequest, DatabaseConnectionRequest, DatabaseConnection } from '../../types';
import { databaseConnectionService } from '../../services/databaseConnectionService';
import DatabaseConnectionModal from './DatabaseConnectionModal';
import toast from 'react-hot-toast';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ApplicationRequest) => Promise<void>;
  application?: ApplicationRequest & { id?: number };
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
  // const [editingConnection, setEditingConnection] = useState<DatabaseConnection | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ApplicationRequest>({
    defaultValues: {
      name: '',
      description: '',
      version: '',
      environment: 'Development',
      tags: '',
      isActive: true
    }
  });

  // Load connections when editing an existing application
  useEffect(() => {
    if (mode === 'edit' && application?.id && isOpen) {
      loadConnections();
    }
  }, [mode, application?.id, isOpen]);

  const loadConnections = async () => {
    if (!application?.id) return;
    try {
      const connectionData = await databaseConnectionService.getConnections(application.id);
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
        name: '',
        description: '',
        version: '',
        environment: 'Development',
        tags: '',
        isActive: true
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
      toast.success('Connection deleted successfully');
      loadConnections();
    } catch (error) {
      console.error('Error deleting connection:', error);
      toast.error('Failed to delete connection');
    }
  };

  const toggleConnectionStatus = async (connectionId: number, currentStatus: boolean) => {
    try {
      await databaseConnectionService.toggleConnectionStatus(connectionId, !currentStatus);
      toast.success(`Connection ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      loadConnections();
    } catch (error) {
      console.error('Error toggling connection status:', error);
      toast.error('Failed to update connection status');
    }
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
                  <label htmlFor="name" className="label">
                    Application Name *
                  </label>
                  <input
                    {...register('name', {
                      required: 'Application name is required',
                      minLength: {
                        value: 3,
                        message: 'Name must be at least 3 characters'
                      }
                    })}
                    type="text"
                    id="name"
                    className="input"
                    placeholder="e.g., E-commerce API"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-error-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="description" className="label">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    id="description"
                    rows={3}
                    className="input"
                    placeholder="Brief description of the application"
                  />
                </div>

                <div>
                  <label htmlFor="version" className="label">
                    Version
                  </label>
                  <input
                    {...register('version')}
                    type="text"
                    id="version"
                    className="input"
                    placeholder="e.g., 1.0.0"
                  />
                </div>

                <div>
                  <label htmlFor="environment" className="label">
                    Environment
                  </label>
                  <select
                    {...register('environment')}
                    id="environment"
                    className="input"
                  >
                    <option value="Development">Development</option>
                    <option value="Staging">Staging</option>
                    <option value="Production">Production</option>
                    <option value="Testing">Testing</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="tags" className="label">
                    Tags
                  </label>
                  <input
                    {...register('tags')}
                    type="text"
                    id="tags"
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
                      {...register('isActive')}
                      type="checkbox"
                      id="isActive"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm font-medium text-gray-900">
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
                    <div key={connection.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-gray-900">{connection.name}</h4>
                            <span className={`badge ${connection.isActive ? 'badge-success' : 'badge-secondary'}`}>
                              {connection.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{connection.typeName}</p>
                          {connection.description && (
                            <p className="text-sm text-gray-500 mb-2">{connection.description}</p>
                          )}
                          <div className="text-xs text-gray-400">
                            Created: {new Date(connection.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => toggleConnectionStatus(connection.id, connection.isActive)}
                            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            title={connection.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {connection.isActive ? (
                              <ToggleRight className="w-4 h-4 text-success-600" />
                            ) : (
                              <ToggleLeft className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteConnection(connection.id)}
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
              onClose={() => setIsConnectionFormOpen(false)}
              onSubmit={async (data: DatabaseConnectionRequest) => {
                try {
                  await databaseConnectionService.createConnection(data);
                  toast.success('Database connection created successfully');
                  loadConnections();
                  setIsConnectionFormOpen(false);
                } catch (error) {
                  console.error('Error creating connection:', error);
                  toast.error('Failed to create database connection');
                  throw error;
                }
              }}
              applicationId={application.id}
              applicationName={application.name}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationModal;