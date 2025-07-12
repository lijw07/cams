import React from 'react';

import { ArrowLeft, ArrowRight, TestTube } from 'lucide-react';

import { useApplicationWithConnection } from '../../hooks/useApplicationWithConnection';
import { ApplicationWithConnectionRequest } from '../../types';
import Button from '../common/Button';
import Modal from '../common/Modal';
import ApplicationDetailsStep from '../forms/ApplicationDetailsStep';
import DatabaseConnectionStep from '../forms/DatabaseConnectionStep';
import StepIndicator from '../ui/StepIndicator';


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
  const {
    currentStep,
    selectedDbType,
    setSelectedDbType,
    isTestingConnection,
    testResult,
    register,
    handleSubmit,
    watch,
    control,
    errors,
    isSubmitting,
    handleFormSubmit,
    handleClose,
    nextStep,
    prevStep,
    getDatabaseTypeOptions,
    isApiType,
    isConnectionStringType,
    isCloudPlatform,
    handleTestConnection
  } = useApplicationWithConnection({ isOpen, onSubmit, onClose });

  const steps = [
    { number: 1, label: 'Application', completed: currentStep > 1, active: currentStep === 1 },
    { number: 2, label: 'Connection', completed: false, active: currentStep === 2 }
  ];

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" showCloseButton={false}>
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Create Application with Connection
        </h2>
      </div>

      <div className="p-6">
        <StepIndicator steps={steps} />

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {currentStep === 1 && (
            <ApplicationDetailsStep
              register={register}
              errors={errors}
            />
          )}

          {currentStep === 2 && (
            <DatabaseConnectionStep
              register={register}
              errors={errors}
              control={control}
              watch={watch}
              selectedDbType={selectedDbType}
              setSelectedDbType={setSelectedDbType}
              getDatabaseTypeOptions={getDatabaseTypeOptions}
              isApiType={isApiType}
              isConnectionStringType={isConnectionStringType}
              isCloudPlatform={isCloudPlatform}
              testResult={testResult}
              handleTestConnection={handleTestConnection}
              isTestingConnection={isTestingConnection}
            />
          )}

          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-3">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={prevStep}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>

            <div className="flex space-x-3">
              {currentStep === 2 ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleTestConnection}
                  disabled={isTestingConnection || isSubmitting}
                >
                  {isTestingConnection ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube className="w-4 h-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}

              {currentStep < steps.length ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={isSubmitting}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting || isTestingConnection}
                  loading={isSubmitting}
                >
                  Create Application & Connection
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ApplicationWithConnectionModal;