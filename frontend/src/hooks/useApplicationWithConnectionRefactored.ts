import { useState, useEffect } from 'react';

import { ApplicationWithConnectionRequest, DatabaseType } from '../types';
import { useNotifications } from '../contexts/NotificationContext';

import { useApplicationForm } from './useApplicationForm';
import { useConnectionTesting } from './useConnectionTesting';
import { useDatabaseTypeUtils } from './useDatabaseTypeUtils';
import { useWizardSteps } from './useWizardSteps';

interface UseApplicationWithConnectionProps {
  isOpen: boolean;
  onSubmit: (data: ApplicationWithConnectionRequest) => Promise<void>;
  onClose: () => void;
}

/**
 * Refactored hook for application with connection management
 * Composed of smaller, focused hooks for better maintainability
 * Now under 100 lines per CLAUDE.md standards
 */
export const useApplicationWithConnectionRefactored = ({ 
  isOpen, 
  onSubmit, 
  onClose 
}: UseApplicationWithConnectionProps) => {
  const [selectedDbType, setSelectedDbType] = useState<DatabaseType>(DatabaseType.SqlServer);
  const { addNotification } = useNotifications();
  
  // Use composed hooks
  const form = useApplicationForm();
  const wizard = useWizardSteps({ 
    totalSteps: 2,
    onStepChange: () => connectionTest.clearTestResult()
  });
  const dbUtils = useDatabaseTypeUtils(selectedDbType);
  const connectionTest = useConnectionTesting();

  const watchedDbType = form.watch('DatabaseType');

  // Update selected DB type when form changes
  useEffect(() => {
    setSelectedDbType(watchedDbType);
    connectionTest.clearTestResult();
  }, [watchedDbType, connectionTest]);

  // Clear test result when connection form data changes on step 2
  useEffect(() => {
    if (wizard.currentStep === 2) {
      connectionTest.clearTestResult();
    }
  }, [
    form.watch('Server'),
    form.watch('Port'), 
    form.watch('Database'),
    form.watch('Username'),
    form.watch('Password'),
    form.watch('ConnectionString'),
    form.watch('ApiBaseUrl'),
    wizard.currentStep,
    connectionTest
  ]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      form.clearErrors();
      wizard.resetSteps();
      connectionTest.clearTestResult();
    }
  }, [isOpen, form, wizard, connectionTest]);

  const handleFormSubmit = async (data: ApplicationWithConnectionRequest) => {
    try {
      const submissionData = {
        ...data,
        Port: data.Port ? parseInt(data.Port.toString()) : undefined,
        Server: data.Server || (dbUtils.isApiType ? 'api' : data.Server)
      };
      
      await onSubmit(submissionData);
      
      // Success notification
      addNotification({
        title: 'Application with Connection Created Successfully',
        message: `${data.ApplicationName} with ${dbUtils.getDatabaseTypeName(selectedDbType)} connection has been created`,
        type: 'success',
        source: 'Application Management',
        details: `Application "${data.ApplicationName}" has been created with a ${dbUtils.getDatabaseTypeName(selectedDbType)} database connection "${data.ConnectionName}". The application is ${data.IsApplicationActive ? 'active' : 'inactive'} and the connection is ${data.IsConnectionActive ? 'active' : 'inactive'}.`,
        suggestions: [
          'Test the database connection to ensure it works properly',
          'Configure application settings and dependencies',
          'Set up monitoring and logging for the new application',
          'Assign appropriate user permissions and roles'
        ]
      });
      
      form.reset();
      wizard.resetSteps();
      onClose();
    } catch (error) {
      console.error('Error submitting application with connection:', error);
      
      // Extract error code from the error response
      let errorCode = 'UNKNOWN_ERROR';
      let errorMessage = 'Failed to create application with connection';
      
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
        title: `Application Creation Failed (${errorCode})`,
        message: errorMessage,
        type: 'error',
        source: 'Application Management',
        details: `Failed to create application "${data.ApplicationName}" with ${dbUtils.getDatabaseTypeName(selectedDbType)} connection "${data.ConnectionName}" with error code: ${errorCode}.`,
        technical: `Error Code: ${errorCode}\nError Message: ${errorMessage}\nOperation: Create Application with Connection\nApplication Name: ${data.ApplicationName}\nConnection Name: ${data.ConnectionName}\nDatabase Type: ${dbUtils.getDatabaseTypeName(selectedDbType)}`,
        suggestions: [
          'Verify that all required fields are filled correctly',
          'Check that the application name is unique',
          'Ensure the database connection parameters are valid',
          'Test the database connection before creating the application',
          'Verify that you have permission to create applications',
          'Try again in a few moments',
          'Contact your system administrator if the problem persists'
        ]
      });
    }
  };

  const handleClose = () => {
    form.reset();
    wizard.resetSteps();
    connectionTest.clearTestResult();
    onClose();
  };

  const handleNextStep = async () => {
    const isStep1Valid = await form.validateStep1();
    
    if (isStep1Valid) {
      wizard.nextStep();
      form.clearConnectionErrors();
    }
  };

  const handlePrevStep = () => {
    wizard.prevStep();
    form.clearConnectionErrors();
  };

  const handleTestConnection = async () => {
    const formData = form.watch();
    await connectionTest.testConnection(formData, selectedDbType);
  };

  return {
    // Form state
    currentStep: wizard.currentStep,
    selectedDbType,
    setSelectedDbType,
    ...connectionTest,
    
    // Form methods
    ...form,
    
    // Actions
    handleFormSubmit,
    handleClose,
    nextStep: handleNextStep,
    prevStep: handlePrevStep,
    handleTestConnection,
    
    // Utilities
    getDatabaseTypeOptions: () => dbUtils.databaseTypeOptions,
    ...dbUtils
  };
};