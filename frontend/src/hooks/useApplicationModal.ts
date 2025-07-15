import { useEffect, useState, useCallback } from 'react';

import { useForm } from 'react-hook-form';

import { useNotifications } from '../contexts/NotificationContext';
import { databaseConnectionService } from '../services/databaseConnectionService';
import { ApplicationRequest, DatabaseConnection, DatabaseConnectionRequest, DatabaseConnectionUpdateRequest } from '../types';

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
  const [localConnections, setLocalConnections] = useState<DatabaseConnection[]>([]);
  const [pendingActions, setPendingActions] = useState<{
    added: DatabaseConnection[];
    updated: DatabaseConnection[];
    deleted: string[];
    assigned: string[];
    unassigned: string[];
  }>({ added: [], updated: [], deleted: [], assigned: [], unassigned: [] });
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

  const loadConnections = useCallback(async () => {
    const appId = application?.id;
    console.log('Loading connections for application ID:', appId);
    if (!appId) {
      console.log('No application ID provided, skipping connection load');
      return;
    }
    try {
      const connectionData = await databaseConnectionService.getConnections(appId);
      console.log('Loaded connections from API:', connectionData);
      
      // FIXME: Backend API is not properly filtering by application-id parameter
      // Client-side filtering as backup until backend issue is resolved
      const filteredConnections = connectionData.filter(connection => connection.ApplicationId === appId);
      console.log('Filtered connections for app:', filteredConnections);
      
      setConnections(filteredConnections);
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  }, [application?.id]);

  useEffect(() => {
    if (mode === 'edit' && isOpen && application?.id) {
      // Always load fresh connections from the API to ensure accuracy
      loadConnections();
    }
  }, [mode, application?.id, isOpen, loadConnections]);

  // Sync local connections with loaded connections
  useEffect(() => {
    setLocalConnections(connections);
  }, [connections]);

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

  // Close connection modal when main modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsConnectionFormOpen(false);
      setEditingConnection(null);
      // Reset pending actions when modal closes
      setPendingActions({ added: [], updated: [], deleted: [], assigned: [], unassigned: [] });
    }
  }, [isOpen]);

  const handleFormSubmit = async (data: ApplicationRequest) => {
    try {
      // First, submit the application data
      await onSubmit(data);
      
      // Then, apply pending connection changes if in edit mode
      if (mode === 'edit' && application?.id) {
        // Only process assignments, unassignments, and new additions
        // (Updates and deletes are now handled immediately)
        
        // Process unassignments
        for (const connectionId of pendingActions.unassigned) {
          await databaseConnectionService.unassignConnectionFromApplication(connectionId);
        }
        
        // Process assignments
        for (const connectionId of pendingActions.assigned) {
          await databaseConnectionService.assignConnectionToApplication(connectionId, application.id);
        }
        
        // Process new additions
        for (const connection of pendingActions.added) {
          const createData: DatabaseConnectionRequest = {
            ApplicationId: application.id,
            Name: connection.Name,
            Description: connection.Description,
            Type: connection.Type,
            Server: connection.Server,
            Port: connection.Port,
            Database: connection.Database,
            Username: connection.Username,
            Password: connection.Password,
            ConnectionString: connection.ConnectionString,
            ApiBaseUrl: connection.ApiBaseUrl,
            ApiKey: connection.ApiKey,
            AdditionalSettings: connection.AdditionalSettings,
            IsActive: connection.IsActive
          };
          await databaseConnectionService.createConnection(createData);
        }
        
        if (pendingActions.assigned.length > 0 || 
            pendingActions.unassigned.length > 0 || 
            pendingActions.added.length > 0) {
          addNotification({
            title: 'Application Updated',
            message: 'Application and connection assignments saved successfully',
            type: 'success',
            source: 'Application Management'
          });
        }
      }
      
      reset();
      onClose();
    } catch (error) {
      console.error('Error submitting application:', error);
      addNotification({
        title: 'Save Failed',
        message: 'Failed to save all changes. Some connections may not have been updated.',
        type: 'error',
        source: 'Application Management'
      });
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    if (!confirm('Are you sure you want to delete this connection?')) return;
    
    try {
      // Check if this is a newly added connection (not yet saved to database)
      const isNewlyAdded = pendingActions.added.some(c => c.Id === connectionId);
      
      if (isNewlyAdded) {
        // For new connections, just remove locally
        setLocalConnections(prev => prev.filter(c => c.Id !== connectionId));
        setPendingActions(prev => ({
          ...prev,
          added: prev.added.filter(c => c.Id !== connectionId)
        }));
        
        addNotification({
          title: 'Connection Removed',
          message: 'Connection removed from pending changes',
          type: 'info',
          source: 'Database Connection'
        });
      } else {
        // For existing connections, delete immediately from database
        await databaseConnectionService.deleteConnection(connectionId);
        
        // Remove from local connections
        setLocalConnections(prev => prev.filter(c => c.Id !== connectionId));
        
        // Remove from pending actions if it was there
        setPendingActions(prev => ({
          ...prev,
          deleted: prev.deleted.filter(id => id !== connectionId),
          updated: prev.updated.filter(c => c.Id !== connectionId)
        }));
        
        addNotification({
          title: 'Connection Deleted',
          message: 'Connection deleted successfully',
          type: 'success',
          source: 'Database Connection'
        });
      }
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
      // Check if this is a newly added connection (not yet saved to database)
      const isNewlyAdded = pendingActions.added.some(c => c.Id === connectionId);
      
      if (isNewlyAdded) {
        // For new connections, just update locally
        setLocalConnections(prev => prev.map(c => 
          c.Id === connectionId ? { ...c, IsActive: !currentStatus } : c
        ));
        
        setPendingActions(prev => ({
          ...prev,
          added: prev.added.map(c => 
            c.Id === connectionId ? { ...c, IsActive: !currentStatus } : c
          )
        }));
        
        addNotification({
          title: 'Connection Status Changed',
          message: `Connection will be ${!currentStatus ? 'activated' : 'deactivated'} when you save the application`,
          type: 'info',
          source: 'Database Connection'
        });
      } else {
        // For existing connections, save immediately to database
        await databaseConnectionService.toggleConnectionStatus(connectionId, !currentStatus);
        
        // Update local connections
        setLocalConnections(prev => prev.map(c => 
          c.Id === connectionId ? { ...c, IsActive: !currentStatus } : c
        ));
        
        addNotification({
          title: 'Connection Updated',
          message: `Connection ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
          type: 'success',
          source: 'Database Connection'
        });
      }
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

  const handleAssignConnection = async (connectionId: string, connectionData: DatabaseConnectionSummary) => {
    // Create a full connection object from the summary
    const newConnection: DatabaseConnection = {
      Id: connectionId,
      ApplicationId: application?.id || '',
      Name: connectionData.Name,
      Description: connectionData.Description || '',
      Type: connectionData.Type,
      TypeName: connectionData.TypeName || connectionData.Type,
      Server: connectionData.Server,
      Port: connectionData.Port,
      Database: connectionData.Database || '',
      Username: connectionData.Username || '',
      ConnectionString: connectionData.ConnectionString || '',
      ApiBaseUrl: connectionData.ApiBaseUrl || '',
      AdditionalSettings: connectionData.AdditionalSettings || '',
      IsActive: connectionData.IsActive,
      CreatedAt: connectionData.CreatedAt,
      UpdatedAt: connectionData.UpdatedAt,
      LastTestedAt: connectionData.LastTestedAt,
      LastAccessedAt: connectionData.LastAccessedAt
    };
    
    // Add to local connections
    setLocalConnections(prev => [...prev, newConnection]);
    
    // Track in pending actions
    setPendingActions(prev => ({
      ...prev,
      assigned: [...prev.assigned, connectionId],
      // Remove from unassigned if it was there
      unassigned: prev.unassigned.filter(id => id !== connectionId)
    }));
    
    addNotification({
      title: 'Connection Assigned',
      message: 'Connection will be assigned when you save changes',
      type: 'info',
      source: 'Database Connection'
    });
  };

  const handleUnassignConnection = (connectionId: string) => {
    // Remove from local connections
    setLocalConnections(prev => prev.filter(c => c.Id !== connectionId));
    
    // Track in pending actions
    setPendingActions(prev => ({
      ...prev,
      unassigned: [...prev.unassigned, connectionId],
      // Remove from assigned if it was there
      assigned: prev.assigned.filter(id => id !== connectionId),
      // Also remove from added/updated if it was there
      added: prev.added.filter(c => c.Id !== connectionId),
      updated: prev.updated.filter(c => c.Id !== connectionId)
    }));
    
    addNotification({
      title: 'Connection Unassigned',
      message: 'Connection will be unassigned when you save changes',
      type: 'info',
      source: 'Database Connection'
    });
  };

  const handleConnectionSubmit = async (data: DatabaseConnectionRequest | DatabaseConnectionUpdateRequest) => {
    try {
      console.log('Connection submit data:', data);
      console.log('Application ID:', application?.id);
      
      if (editingConnection) {
        // For editing existing connections, save immediately to database
        await databaseConnectionService.updateConnection(editingConnection.Id, data as DatabaseConnectionUpdateRequest);
        
        // Update local connections to reflect the change
        const updatedConnection = { ...editingConnection, ...data };
        setLocalConnections(prev => prev.map(c => 
          c.Id === editingConnection.Id ? updatedConnection : c
        ));
        
        // Remove from pending actions if it was there
        setPendingActions(prev => ({
          ...prev,
          updated: prev.updated.filter(c => c.Id !== editingConnection.Id)
        }));
        
        addNotification({
          title: 'Connection Updated',
          message: 'Database connection updated successfully',
          type: 'success',
          source: 'Database Connection'
        });
      } else {
        // For new connections, keep them local until save
        const newConnection: DatabaseConnection = {
          Id: `temp-${Date.now()}`, // Temporary ID
          ApplicationId: application?.id || '',
          Name: data.Name,
          Description: data.Description,
          Type: data.Type,
          TypeName: data.Type,
          Server: data.Server,
          Port: data.Port,
          Database: data.Database,
          Username: data.Username,
          ConnectionString: data.ConnectionString,
          ApiBaseUrl: data.ApiBaseUrl,
          AdditionalSettings: data.AdditionalSettings,
          IsActive: data.IsActive,
          CreatedAt: new Date().toISOString(),
          UpdatedAt: new Date().toISOString(),
          LastTestedAt: null,
          LastAccessedAt: null,
          Password: (data as DatabaseConnectionRequest).Password,
          ApiKey: (data as DatabaseConnectionRequest).ApiKey
        };
        
        setLocalConnections(prev => [...prev, newConnection]);
        setPendingActions(prev => ({
          ...prev,
          added: [...prev.added, newConnection]
        }));
        
        addNotification({
          title: 'Connection Added',
          message: 'Connection will be created when you save the application',
          type: 'info',
          source: 'Database Connection'
        });
      }
      
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
    connections: localConnections,
    isConnectionFormOpen,
    setIsConnectionFormOpen,
    editingConnection,
    handleFormSubmit,
    handleDeleteConnection,
    toggleConnectionStatus,
    handleEditConnection,
    handleCloseConnectionModal,
    handleConnectionSubmit,
    handleAssignConnection,
    handleUnassignConnection,
    loadConnections,
    hasPendingChanges: pendingActions.added.length > 0 || 
                      pendingActions.assigned.length > 0 ||
                      pendingActions.unassigned.length > 0
  };
};