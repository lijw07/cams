import { useEffect, useState } from 'react';

import { useForm } from 'react-hook-form';

import { useNotifications } from '../contexts/NotificationContext';
import { DatabaseConnectionRequest, DatabaseConnectionUpdateRequest, DatabaseConnection, DatabaseType } from '../types';
import { getDatabaseTypeOptions, isApiType as checkIsApiType, isConnectionStringType as checkIsConnectionStringType } from '../utils/databaseUtils';

interface UseDatabaseConnectionModalProps {
  isOpen: boolean;
  applicationId: string;
  connection?: DatabaseConnection;
  mode?: 'create' | 'edit';
  onSubmit: (data: DatabaseConnectionRequest | DatabaseConnectionUpdateRequest) => Promise<void>;
  onClose: () => void;
}

export const useDatabaseConnectionModal = ({
  isOpen,
  applicationId,
  connection,
  mode = 'create',
  onSubmit,
  onClose
}: UseDatabaseConnectionModalProps) => {
  const [selectedDbType, setSelectedDbType] = useState<DatabaseType>(DatabaseType.SqlServer);
  const { addNotification } = useNotifications();

  const form = useForm<DatabaseConnectionRequest | DatabaseConnectionUpdateRequest>({
    mode: 'onSubmit',  // Only validate when form is submitted
    defaultValues: {
      ApplicationId: applicationId,
      Name: '',
      Description: '',
      Type: DatabaseType.SqlServer,
      Server: '',
      Port: undefined,
      Database: '',
      Username: '',
      Password: '',
      ConnectionString: '',
      ApiBaseUrl: '',
      ApiKey: '',
      AdditionalSettings: '',
      IsActive: true,
      GitHubToken: '',
      GitHubOrganization: '',
      GitHubRepository: ''
    }
  });

  const { register, handleSubmit, reset, watch, control, getValues, formState: { errors, isSubmitting } } = form;
  const watchedDbType = watch('Type');

  useEffect(() => {
    setSelectedDbType(watchedDbType);
  }, [watchedDbType]);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && connection) {
        reset({
          ...(mode === 'edit' ? { Id: connection.Id } : {}),
          ApplicationId: applicationId,
          Name: connection.Name,
          Description: connection.Description || '',
          Type: connection.Type,
          Server: connection.Server,
          Port: connection.Port,
          Database: connection.Database || '',
          Username: connection.Username || '',
          Password: '',
          ConnectionString: connection.ConnectionString || '',
          ApiBaseUrl: connection.ApiBaseUrl || '',
          ApiKey: '',
          AdditionalSettings: connection.AdditionalSettings || '',
          IsActive: connection.IsActive,
          GitHubToken: '',
          GitHubOrganization: (connection as any).GitHubOrganization || '',
          GitHubRepository: (connection as any).GitHubRepository || ''
        });
        setSelectedDbType(connection.Type);
      } else {
        reset({
          ApplicationId: applicationId,
          Name: '',
          Description: '',
          Type: DatabaseType.SqlServer,
          Server: '',
          Port: undefined,
          Database: '',
          Username: '',
          Password: '',
          ConnectionString: '',
          ApiBaseUrl: '',
          ApiKey: '',
          AdditionalSettings: '',
          IsActive: true,
          GitHubToken: '',
          GitHubOrganization: '',
          GitHubRepository: ''
        });
        setSelectedDbType(DatabaseType.SqlServer);
      }
    }
  }, [isOpen, applicationId, connection, mode, reset]);

  const handleFormSubmit = async (data: DatabaseConnectionRequest | DatabaseConnectionUpdateRequest) => {
    try {
      const submissionData = {
        ...data,
        Port: data.Port ? parseInt(data.Port.toString()) : undefined
      };
      
      if (mode === 'edit' && connection) {
        (submissionData as DatabaseConnectionUpdateRequest).Id = connection.Id;
      }
      
      await onSubmit(submissionData);
      
      // Success notification
      addNotification({
        title: `Database Connection ${mode === 'edit' ? 'Updated' : 'Created'} Successfully`,
        message: `${data.Name} has been ${mode === 'edit' ? 'updated' : 'created'} successfully`,
        type: 'success',
        source: 'Database Connection',
        details: `Connection "${data.Name}" for ${data.Type} database has been ${mode === 'edit' ? 'updated' : 'created'} and is ${data.IsActive ? 'active' : 'inactive'}.`,
        suggestions: [
          'Test the connection to ensure it works properly',
          'Configure any additional settings if needed',
          'Monitor the connection status in the dashboard'
        ]
      });
      
      reset();
      onClose();
    } catch (error) {
      console.error('Error submitting database connection:', error);
      
      // Extract error code from the error response
      let errorCode = 'UNKNOWN_ERROR';
      let errorMessage = 'Failed to save database connection';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as any).response;
        if (response?.data?.ErrorCode) {
          errorCode = response.data.ErrorCode;
        } else if (response?.status) {
          errorCode = `HTTP_${response.status}`;
        }
        
        if (response?.data?.Message) {
          errorMessage = response.data.Message;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
        errorCode = 'CLIENT_ERROR';
      }
      
      // Error notification
      addNotification({
        title: `Database Connection ${mode === 'edit' ? 'Update' : 'Creation'} Failed (${errorCode})`,
        message: errorMessage,
        type: 'error',
        source: 'Database Connection',
        details: `Failed to ${mode === 'edit' ? 'update' : 'create'} the database connection "${data.Name}" with error code: ${errorCode}.`,
        technical: `Error Code: ${errorCode}\nError Message: ${errorMessage}\nOperation: ${mode === 'edit' ? 'Update' : 'Create'} Database Connection\nConnection Name: ${data.Name}\nDatabase Type: ${data.Type}`,
        suggestions: [
          'Verify that all required fields are filled correctly',
          'Check that the connection name is unique',
          'Ensure you have permission to create/edit database connections',
          'Try again in a few moments',
          'Contact your system administrator if the problem persists'
        ]
      });
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const isApiType = () => checkIsApiType(selectedDbType);
  const isConnectionStringType = () => checkIsConnectionStringType(selectedDbType);

  return {
    register,
    handleSubmit,
    control,
    errors,
    isSubmitting,
    selectedDbType,
    setSelectedDbType,
    handleFormSubmit,
    handleClose,
    getDatabaseTypeOptions,
    isApiType,
    isConnectionStringType,
    getValues
  };
};