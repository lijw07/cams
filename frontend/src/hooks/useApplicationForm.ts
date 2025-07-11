import { useForm } from 'react-hook-form';

import { ApplicationWithConnectionRequest, DatabaseType } from '../types';

/**
 * Hook for managing application with connection form state
 * Handles form initialization, validation, and submission
 */
export const useApplicationForm = () => {
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

  const handleFormReset = () => {
    reset();
    clearErrors();
  };

  const validateStep1 = async () => {
    return await trigger(['ApplicationName']);
  };

  const clearConnectionErrors = () => {
    clearErrors([
      'ConnectionName', 
      'DatabaseType', 
      'Server', 
      'Database', 
      'Username', 
      'Password', 
      'ConnectionString', 
      'ApiBaseUrl'
    ]);
  };

  return {
    form,
    register,
    handleSubmit,
    reset: handleFormReset,
    watch,
    control,
    clearErrors,
    trigger,
    errors,
    isSubmitting,
    validateStep1,
    clearConnectionErrors
  };
};