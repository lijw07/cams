import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ApplicationWithConnectionRequest, DatabaseType } from '../types';
import { databaseConnectionService } from '../services/databaseConnectionService';
import { useNotifications } from '../contexts/NotificationContext';

interface UseApplicationWithConnectionProps {
  isOpen: boolean;
  onSubmit: (data: ApplicationWithConnectionRequest) => Promise<void>;
  onClose: () => void;
}

export const useApplicationWithConnection = ({ 
  isOpen, 
  onSubmit, 
  onClose 
}: UseApplicationWithConnectionProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDbType, setSelectedDbType] = useState<DatabaseType>(DatabaseType.SqlServer);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const { addNotification } = useNotifications();

  const form = useForm<ApplicationWithConnectionRequest>({
    defaultValues: {
      ApplicationName: '',
      ApplicationDescription: '',
      Version: '',
      Environment: 'Development',
      Tags: '',
      IsApplicationActive: true,
      ConnectionName: '',
      ConnectionDescription: '',
      DatabaseType: DatabaseType.SqlServer,
      Server: '',
      Port: undefined,
      Database: '',
      Username: '',
      Password: '',
      ConnectionString: '',
      ApiBaseUrl: '',
      ApiKey: '',
      AdditionalSettings: '',
      IsConnectionActive: true,
      TestConnectionOnCreate: false
    }
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    clearErrors,
    trigger,
    formState: { errors, isSubmitting }
  } = form;

  const watchedDbType = watch('DatabaseType');
  const watchedServer = watch('Server');
  const watchedPort = watch('Port');
  const watchedDatabase = watch('Database');
  const watchedUsername = watch('Username');
  const watchedPassword = watch('Password');
  const watchedConnectionString = watch('ConnectionString');
  const watchedApiBaseUrl = watch('ApiBaseUrl');

  useEffect(() => {
    setSelectedDbType(watchedDbType);
    setTestResult(null);
  }, [watchedDbType]);

  // Clear test result when connection form data changes
  useEffect(() => {
    if (currentStep === 2) {
      setTestResult(null);
    }
  }, [watchedServer, watchedPort, watchedDatabase, watchedUsername, watchedPassword, watchedConnectionString, watchedApiBaseUrl, currentStep]);

  // Clear errors when modal opens
  useEffect(() => {
    if (isOpen) {
      clearErrors();
      setCurrentStep(1);
      setTestResult(null);
    }
  }, [isOpen, clearErrors]);

  const handleFormSubmit = async (data: ApplicationWithConnectionRequest) => {
    try {
      const submissionData = {
        ...data,
        Port: data.Port ? parseInt(data.Port.toString()) : undefined,
        Server: data.Server || (isApiType() ? 'api' : data.Server)
      };
      
      await onSubmit(submissionData);
      reset();
      setCurrentStep(1);
      onClose();
    } catch (error) {
      // Error is handled by the parent component
    }
  };

  const handleClose = () => {
    reset();
    setCurrentStep(1);
    setTestResult(null);
    clearErrors();
    onClose();
  };

  const nextStep = async () => {
    const isStep1Valid = await trigger(['ApplicationName']);
    
    if (isStep1Valid) {
      setCurrentStep(2);
      setTestResult(null);
      clearErrors(['ConnectionName', 'DatabaseType', 'Server', 'Database', 'Username', 'Password', 'ConnectionString', 'ApiBaseUrl']);
    }
  };

  const prevStep = () => {
    setCurrentStep(1);
    setTestResult(null);
    clearErrors(['ConnectionName', 'DatabaseType', 'Server', 'Database', 'Username', 'Password', 'ConnectionString', 'ApiBaseUrl']);
  };

  const handleTestConnection = async () => {
    const formData = watch();
    setIsTestingConnection(true);
    setTestResult(null);

    try {
      let testData;
      
      if (isConnectionStringType()) {
        addNotification({
          title: 'Connection Test Unavailable',
          message: 'Connection testing not available for custom connection strings',
          type: 'error',
          source: 'Database Connection'
        });
        setIsTestingConnection(false);
        return;
      } else if (isCloudPlatform()) {
        testData = {
          DatabaseType: formData.DatabaseType,
          Server: formData.Server || formData.ApiBaseUrl || '',
          Database: formData.Database || '',
          Username: formData.Username || formData.ClientId || '',
          Password: formData.Password || formData.ClientSecret || formData.ApiKey || ''
        };
      } else if (isApiType()) {
        testData = {
          DatabaseType: formData.DatabaseType,
          Server: formData.ApiBaseUrl || '',
          ApiKey: formData.ApiKey || '',
          Username: formData.Username || '',
          Password: formData.Password || ''
        };
      } else {
        testData = {
          DatabaseType: formData.DatabaseType,
          Server: formData.Server || '',
          Database: formData.Database || '',
          Username: formData.Username || '',
          Password: formData.Password || '',
          Port: formData.Port
        };
      }

      const result = await databaseConnectionService.testConnection(testData);
      
      if (result.IsSuccessful) {
        setTestResult({ success: true, message: result.Message || 'Connection successful!' });
        addNotification({
          title: 'Connection Test Successful',
          message: 'Database connection test passed!',
          type: 'success',
          source: 'Database Connection'
        });
      } else {
        setTestResult({ success: false, message: result.Message || 'Connection failed' });
        addNotification({
          title: 'Connection Test Failed',
          message: `Connection test failed: ${result.Message}`,
          type: 'error',
          source: 'Database Connection'
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      setTestResult({ success: false, message: errorMessage });
      addNotification({
        title: 'Connection Test Failed',
        message: `Connection test failed: ${errorMessage}`,
        type: 'error',
        source: 'Database Connection'
      });
    } finally {
      setIsTestingConnection(false);
    }
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
    { value: DatabaseType.AWS_RDS, label: 'AWS RDS' },
    { value: DatabaseType.AWS_DynamoDB, label: 'AWS DynamoDB' },
    { value: DatabaseType.AWS_S3, label: 'AWS S3' },
    { value: DatabaseType.Azure_SQL, label: 'Azure SQL' },
    { value: DatabaseType.Azure_CosmosDB, label: 'Azure Cosmos DB' },
    { value: DatabaseType.Azure_Storage, label: 'Azure Storage' },
    { value: DatabaseType.Google_CloudSQL, label: 'Google Cloud SQL' },
    { value: DatabaseType.Google_Firestore, label: 'Google Firestore' },
    { value: DatabaseType.Google_BigQuery, label: 'Google BigQuery' },
    { value: DatabaseType.Salesforce_API, label: 'Salesforce' },
    { value: DatabaseType.ServiceNow_API, label: 'ServiceNow' },
    { value: DatabaseType.Snowflake, label: 'Snowflake' },
    { value: DatabaseType.Databricks, label: 'Databricks' },
    { value: DatabaseType.Custom, label: 'Custom' }
  ];

  const isApiType = () => {
    return [
      DatabaseType.RestApi, 
      DatabaseType.GraphQL, 
      DatabaseType.WebSocket,
      DatabaseType.Salesforce_API,
      DatabaseType.ServiceNow_API
    ].includes(selectedDbType);
  };

  const isConnectionStringType = () => {
    return [DatabaseType.Custom].includes(selectedDbType);
  };

  const isCloudPlatform = () => {
    return selectedDbType >= DatabaseType.AWS_RDS && selectedDbType <= DatabaseType.Databricks;
  };

  return {
    // Form state
    currentStep,
    selectedDbType,
    setSelectedDbType,
    isTestingConnection,
    testResult,
    
    // Form methods
    register,
    handleSubmit,
    watch,
    control,
    errors,
    isSubmitting,
    
    // Actions
    handleFormSubmit,
    handleClose,
    nextStep,
    prevStep,
    handleTestConnection,
    
    // Utilities
    getDatabaseTypeOptions,
    isApiType,
    isConnectionStringType,
    isCloudPlatform
  };
};