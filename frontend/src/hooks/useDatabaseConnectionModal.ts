import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { DatabaseConnectionRequest, DatabaseConnectionUpdateRequest, DatabaseConnection, DatabaseType } from '../types';

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

  const form = useForm<DatabaseConnectionRequest | DatabaseConnectionUpdateRequest>({
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
      IsActive: true
    }
  });

  const { register, handleSubmit, reset, watch, control, formState: { errors, isSubmitting } } = form;
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
          IsActive: connection.IsActive
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
          IsActive: true
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
      reset();
      onClose();
    } catch (error) {
      console.error('Error submitting database connection:', error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const getDatabaseTypeOptions = () => [
    { value: DatabaseType.SqlServer, label: 'SQL Server' },
    { value: DatabaseType.MySQL, label: 'MySQL' },
    { value: DatabaseType.PostgreSQL, label: 'PostgreSQL' },
    { value: DatabaseType.Oracle, label: 'Oracle' },
    { value: DatabaseType.SQLite, label: 'SQLite' },
    { value: DatabaseType.MongoDB, label: 'MongoDB' },
    { value: DatabaseType.Redis, label: 'Redis' },
    { value: DatabaseType.RestApi, label: 'REST API' },
    { value: DatabaseType.GraphQL, label: 'GraphQL' },
    { value: DatabaseType.WebSocket, label: 'WebSocket' },
    { value: DatabaseType.Custom, label: 'Custom' }
  ];

  const isApiType = () => {
    return [DatabaseType.RestApi, DatabaseType.GraphQL, DatabaseType.WebSocket].includes(selectedDbType);
  };

  const isConnectionStringType = () => {
    return [DatabaseType.Custom].includes(selectedDbType);
  };

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
    isConnectionStringType
  };
};