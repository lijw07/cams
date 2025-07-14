import { useState, useEffect } from 'react';

import { useForm } from 'react-hook-form';

import { useNotifications } from '../contexts/NotificationContext';
import { databaseConnectionService } from '../services/databaseConnectionService';
import { ApplicationWithConnectionRequest, DatabaseType } from '../types';

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
    mode: 'onSubmit',  // Only validate when form is submitted
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
    getValues,
    formState: { errors, isSubmitting }
  } = form;

  const watchedDbType = watch('DatabaseType');

  useEffect(() => {
    setSelectedDbType(watchedDbType);
    // Only clear test result when database type changes, not on every field change
    setTestResult(null);
  }, [watchedDbType]);

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
    const formData = getValues();
    console.log('Form data for test connection:', formData);
    setIsTestingConnection(true);
    setTestResult(null);

    // Show immediate notification that test is starting
    addNotification({
      title: 'Testing Connection',
      message: 'Attempting to connect to the database...',
      type: 'info',
      source: 'Database Connection',
      details: 'This process may take a few seconds depending on your network and database configuration.',
      isPersistent: true
    });

    try {
      let testData;
      
      if (isConnectionStringType()) {
        addNotification({
          title: 'Connection Test Unavailable',
          message: 'Connection testing not available for custom connection strings',
          type: 'warning',
          source: 'Database Connection',
          details: 'Custom connection strings cannot be validated automatically for security reasons.',
          suggestions: [
            'Test your connection string manually using a database client',
            'Ensure the connection string format is correct for your database type',
            'Contact your database administrator to verify the connection details'
          ]
        });
        setIsTestingConnection(false);
        return;
      } else if (isCloudPlatform()) {
        testData = {
          ConnectionDetails: {
            ApplicationId: '', // Will be set by backend if needed
            Name: formData.ConnectionName || 'Test Connection',
            Description: formData.ConnectionDescription,
            Type: formData.DatabaseType,
            Server: formData.Server || formData.ApiBaseUrl || '',
            Database: formData.Database || '',
            Username: formData.Username || formData.ClientId || '',
            Password: formData.Password || formData.ClientSecret || formData.ApiKey || '',
            IsActive: true
          }
        };
      } else if (isApiType()) {
        testData = {
          ConnectionDetails: {
            ApplicationId: '', // Will be set by backend if needed
            Name: formData.ConnectionName || 'Test Connection',
            Description: formData.ConnectionDescription,
            Type: formData.DatabaseType,
            Server: formData.ApiBaseUrl || '',
            ApiKey: formData.ApiKey || '',
            ApiBaseUrl: formData.ApiBaseUrl || '',
            Username: formData.Username || '',
            Password: formData.Password || '',
            IsActive: true
          }
        };
      } else {
        testData = {
          ConnectionDetails: {
            ApplicationId: '', // Will be set by backend if needed
            Name: formData.ConnectionName || 'Test Connection',
            Description: formData.ConnectionDescription,
            Type: formData.DatabaseType,
            Server: formData.Server || '',
            Port: formData.Port,
            Database: formData.Database || '',
            Username: formData.Username || '',
            Password: formData.Password || '',
            IsActive: true
          }
        };
      }

      console.log('Test data being sent:', testData);
      const result = await databaseConnectionService.testConnection(testData);
      console.log('Test result:', result);
      
      if (result.IsSuccessful) {
        setTestResult({ success: true, message: result.Message || 'Connection successful!' });
        addNotification({
          title: 'Connection Test Successful',
          message: 'Successfully connected to the database',
          type: 'success',
          source: 'Database Connection',
          details: `Connection established in ${result.Duration || 'unknown'} ms. ${result.AdditionalInfo ? JSON.stringify(result.AdditionalInfo) : ''}`,
          suggestions: [
            'You can now proceed to create the application with this connection',
            'Test the connection periodically to ensure it remains accessible'
          ]
        });
      } else {
        // Extract error code from result
        const errorCode = result.ErrorCode || 'UNKNOWN_ERROR';
        const errorMessage = result.Message || 'Connection failed';
        
        setTestResult({ success: false, message: errorMessage });
        addNotification({
          title: `Connection Test Failed (${errorCode})`,
          message: errorMessage,
          type: 'error',
          source: 'Database Connection',
          details: `The connection test failed with error code: ${errorCode}. Please verify your connection parameters and try again.`,
          technical: `Error Code: ${errorCode}\nError Message: ${errorMessage}\nError Details: ${result.ErrorDetails || 'No additional error details available'}`,
          suggestions: [
            'Verify that the server address and port are correct',
            'Check that the database name exists',
            'Ensure your username and password are valid',
            'Verify that the database server is running and accessible',
            'Check firewall settings that might block the connection'
          ]
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      
      // Try to extract error code from the error response
      let errorCode = 'NETWORK_ERROR';
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as any).response;
        if (response?.data?.ErrorCode) {
          errorCode = response.data.ErrorCode;
        } else if (response?.status) {
          errorCode = `HTTP_${response.status}`;
        }
      }
      
      setTestResult({ success: false, message: errorMessage });
      addNotification({
        title: `Connection Test Failed (${errorCode})`,
        message: 'Network or system error occurred',
        type: 'error',
        source: 'Database Connection',
        details: `The connection test could not be completed due to a system error (${errorCode}).`,
        technical: `Error Code: ${errorCode}\nError: ${errorMessage}\n\nThis could be due to network issues, server problems, or invalid request data.`,
        suggestions: [
          'Check your internet connection',
          'Verify that the CAMS backend server is running',
          'Try again in a few moments',
          'Contact your system administrator if the problem persists'
        ]
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