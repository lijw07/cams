import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Zap } from 'lucide-react';
import { ApplicationWithConnectionRequest, DatabaseType } from '../../types';
import { Modal, Button } from '../common';
import { useConnectionTest } from '../../hooks';
import ApplicationForm from '../forms/ApplicationForm';
import DatabaseConnectionForm from '../forms/DatabaseConnectionForm';
import StepIndicator from '../ui/StepIndicator';
import TestResult from '../ui/TestResult';
import { useNotifications } from '../../contexts/NotificationContext';

interface ApplicationWithConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ApplicationWithConnectionRequest) => Promise<void>;
}

const ApplicationWithConnectionModal: React.FC<ApplicationWithConnectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDbType, setSelectedDbType] = useState<DatabaseType>(DatabaseType.SqlServer);
  const { addNotification } = useNotifications();
  
  const {
    isTestingConnection,
    testResult,
    testConnection,
    clearTestResult
  } = useConnectionTest();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    clearErrors,
    trigger,
    formState: { errors, isSubmitting }
  } = useForm<ApplicationWithConnectionRequest>({
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
    clearTestResult();
  }, [watchedDbType, clearTestResult]);

  useEffect(() => {
    if (currentStep === 2) {
      clearTestResult();
    }
  }, [watchedServer, watchedPort, watchedDatabase, watchedUsername, watchedPassword, watchedConnectionString, watchedApiBaseUrl, currentStep, clearTestResult]);

  useEffect(() => {
    if (isOpen) {
      clearErrors();
      setCurrentStep(1);
      clearTestResult();
    }
  }, [isOpen, clearErrors, clearTestResult]);

  const handleFormSubmit = async (data: ApplicationWithConnectionRequest) => {
    try {
      const submissionData = {
        ...data,
        Port: data.Port ? parseInt(data.Port.toString()) : undefined
      };
      
      await onSubmit(submissionData);
      reset();
      setCurrentStep(1);
      onClose();
    } catch (error) {
      console.error('Error submitting application with connection:', error);
    }
  };

  const handleClose = () => {
    reset();
    setCurrentStep(1);
    clearTestResult();
    clearErrors();
    onClose();
  };

  const nextStep = async () => {
    const isStep1Valid = await trigger(['ApplicationName']);
    
    if (isStep1Valid) {
      setCurrentStep(2);
      clearTestResult();
      clearErrors(['ConnectionName', 'DatabaseType', 'Server', 'Database', 'Username', 'Password', 'ConnectionString', 'ApiBaseUrl']);
    }
  };

  const prevStep = () => {
    setCurrentStep(1);
    clearTestResult();
    clearErrors(['ConnectionName', 'DatabaseType', 'Server', 'Database', 'Username', 'Password', 'ConnectionString', 'ApiBaseUrl']);
  };

  const handleTestConnection = async () => {
    const formData = watch();
    
    const isApiType = [DatabaseType.RestApi, DatabaseType.GraphQL, DatabaseType.WebSocket].includes(selectedDbType);
    const isConnectionStringType = [DatabaseType.Custom].includes(selectedDbType);
    
    if (isConnectionStringType) {
      addNotification({
        title: 'Connection Test',
        message: 'Connection testing not available for custom connection strings',
        type: 'error',
        source: 'Database Test'
      });
      return;
    }
    
    if (isApiType) {
      addNotification({
        title: 'Connection Test',
        message: 'Connection testing not available for API endpoints',
        type: 'error',
        source: 'Database Test'
      });
      return;
    }

    const testData = {
      DatabaseType: formData.DatabaseType,
      Server: formData.Server || '',
      Database: formData.Database || '',
      Username: formData.Username || '',
      Password: formData.Password || '',
      Port: formData.Port
    };

    await testConnection(testData);
  };

  const steps = [
    { number: 1, label: 'Application', completed: currentStep > 1, active: currentStep === 1 },
    { number: 2, label: 'Database', completed: false, active: currentStep === 2 }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Application"
      size="lg"
    >
      <StepIndicator steps={steps} />

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {currentStep === 1 && (
          <ApplicationForm
            register={register}
            errors={errors}
          />
        )}

        {currentStep === 2 && (
          <>
            <DatabaseConnectionForm
              register={register}
              control={control}
              errors={errors}
              selectedDbType={selectedDbType}
              onDbTypeChange={setSelectedDbType}
            />

            {testResult && (
              <TestResult
                success={testResult.success}
                message={testResult.message}
              />
            )}
          </>
        )}

        <div className="flex justify-between pt-4">
          <div>
            {currentStep === 2 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={isSubmitting}
              >
                Previous
              </Button>
            )}
          </div>
          
          <div className="flex space-x-3">
            {currentStep === 1 ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={isSubmitting}
              >
                Next: Database Connection
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isSubmitting || isTestingConnection}
                  loading={isTestingConnection}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Test Connection
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  loading={isSubmitting}
                >
                  Create Application & Connection
                </Button>
              </>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default ApplicationWithConnectionModal;