import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { ApplicationRequest, DatabaseConnection, DatabaseConnectionRequest, DatabaseConnectionUpdateRequest } from '../types';
import { databaseConnectionService } from '../services/databaseConnectionService';
import { useNotifications } from '../contexts/NotificationContext';

interface UseApplicationModalProps {
  isOpen: boolean;
  application?: ApplicationRequest & { id?: string; connections?: DatabaseConnection[] };
  mode: 'create' | 'edit';
  onSubmit: (data: ApplicationRequest) => Promise<void>;
  onClose: () => void;
}

export const useApplicationModal = ({
  isOpen,
  application,
  mode,
  onSubmit,
  onClose
}: UseApplicationModalProps) => {
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [isConnectionFormOpen, setIsConnectionFormOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<DatabaseConnection | null>(null);
  const { addNotification } = useNotifications();

  const form = useForm<ApplicationRequest>({
    defaultValues: {
      Name: '',
      Description: '',
      Version: '',
      Environment: 'Development',
      Tags: '',
      IsActive: true
    }
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = form;

  useEffect(() => {
    if (mode === 'edit' && isOpen) {
      if (application?.connections) {
        setConnections(application.connections);
      } else if (application?.id) {
        loadConnections();
      }
    }
  }, [mode, application?.id, application?.connections, isOpen, loadConnections]);

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

  const loadConnections = useCallback(async () => {
    const appId = application?.id;
    if (!appId) return;
    try {
      const connectionData = await databaseConnectionService.getConnections(appId);
      setConnections(connectionData);
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  }, [application?.id]);

  const handleFormSubmit = async (data: ApplicationRequest) => {
    try {
      await onSubmit(data);
      reset();
      onClose();
    } catch (error) {
      console.error('Error submitting application:', error);
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
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

  const toggleConnectionStatus = async (connectionId: string, currentStatus: boolean) => {
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

  const handleConnectionSubmit = async (data: DatabaseConnectionRequest | DatabaseConnectionUpdateRequest) => {
    try {
      if (editingConnection) {
        await databaseConnectionService.updateConnection(editingConnection.Id, data as DatabaseConnectionUpdateRequest);
        addNotification({
          title: 'Connection Updated',
          message: 'Database connection updated successfully',
          type: 'success',
          source: 'Database Connection'
        });
      } else {
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
  };

  return {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    connections,
    isConnectionFormOpen,
    setIsConnectionFormOpen,
    editingConnection,
    handleFormSubmit,
    handleDeleteConnection,
    toggleConnectionStatus,
    handleEditConnection,
    handleCloseConnectionModal,
    handleConnectionSubmit
  };
};