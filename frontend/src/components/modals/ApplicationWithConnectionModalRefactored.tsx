import React from 'react';

import { X, Zap } from 'lucide-react';

import { useApplicationWithConnection } from '../../hooks/useApplicationWithConnection';
import { ApplicationWithConnectionRequest } from '../../types';
import ApplicationDetailsStep from '../forms/ApplicationDetailsStep';
import DatabaseConnectionStep from '../forms/DatabaseConnectionStep';

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
    handleTestConnection,
    getDatabaseTypeOptions,
    isApiType,
    isConnectionStringType,
    isCloudPlatform
  } = useApplicationWithConnection({ isOpen, onSubmit, onClose });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative bg-white dark:bg-secondary-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">
              Create Application
            </h2>
            <button
              onClick={handleClose}
              className="p-1 rounded-md text-secondary-400 dark:text-secondary-500 hover:text-secondary-500 dark:hover:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 1 ? 'bg-primary-600 text-white' : 'bg-secondary-300 dark:bg-secondary-600 text-secondary-600 dark:text-secondary-400'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium text-secondary-900 dark:text-white">Application</span>
            </div>
            <div className="flex-1 h-1 mx-4 bg-secondary-200 dark:bg-secondary-700">
              <div className={`h-full ${currentStep >= 2 ? 'bg-primary-600' : 'bg-secondary-300 dark:bg-secondary-600'} transition-all`} />
            </div>
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-secondary-300 dark:bg-secondary-600 text-secondary-600 dark:text-secondary-400'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium text-secondary-900 dark:text-white">Database</span>
            </div>
          </div>

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
                control={control}
                errors={errors}
                watch={watch}
                selectedDbType={selectedDbType}
                setSelectedDbType={setSelectedDbType}
                getDatabaseTypeOptions={getDatabaseTypeOptions}
                isApiType={isApiType}
                isConnectionStringType={isConnectionStringType}
                isCloudPlatform={isCloudPlatform}
                testResult={testResult}
              />
            )}

            <div className="flex justify-between pt-4">
              <div>
                {currentStep === 2 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="btn btn-outline"
                    disabled={isSubmitting}
                  >
                    Previous
                  </button>
                )}
              </div>
              
              <div className="flex space-x-3">
                {currentStep === 1 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    Next: Database Connection
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      className="btn btn-outline"
                      disabled={isSubmitting || isTestingConnection}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      {isTestingConnection ? 'Testing...' : 'Test Connection'}
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Creating...' : 'Create Application & Connection'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplicationWithConnectionModal;