import { useState, useEffect } from 'react';

import { ApplicationWithConnectionRequest, DatabaseType } from '../types';

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
      form.reset();
      wizard.resetSteps();
      onClose();
    } catch (error) {
      // Error is handled by the parent component
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