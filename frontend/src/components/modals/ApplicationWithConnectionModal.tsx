import React, { useRef, useState, useEffect } from 'react';

import { ArrowLeft, ArrowRight, TestTube, X } from 'lucide-react';

import { useApplicationWithConnection } from '../../hooks/useApplicationWithConnection';
import { useModalStack } from '../../hooks/useModalStack';
import { ApplicationWithConnectionRequest } from '../../types';
import Button from '../common/Button';
import Modal from '../common/Modal';
import ApplicationDetailsStep from '../forms/ApplicationDetailsStep';
import DatabaseConnectionStep from '../forms/DatabaseConnectionStep';
import StepIndicator from '../ui/StepIndicator';
import ConnectionTestResultPopup from '../ui/ConnectionTestResultPopup';


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
  // Register this modal with the modal stack
  useModalStack(isOpen, onClose);

  // State for connection test result popup
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [detailedTestResult, setDetailedTestResult] = useState<any>(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const testButtonRef = useRef<HTMLButtonElement>(null);

  const {
    currentStep,
    selectedDbType,
    setSelectedDbType,
    isTestingConnection,
    testResult,
    fullTestResult,
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

  // Watch for changes in fullTestResult and show popup
  useEffect(() => {
    if (fullTestResult && !isTestingConnection) {
      setDetailedTestResult(fullTestResult);
      
      // Calculate popup position relative to button
      if (testButtonRef.current) {
        const buttonRect = testButtonRef.current.getBoundingClientRect();
        setPopupPosition({
          top: buttonRect.top - 10,
          left: buttonRect.left + (buttonRect.width / 2) - 160 // Center popup above button
        });
      }
      
      // Show popup after a short delay
      setTimeout(() => {
        setShowResultPopup(true);
      }, 100);
    }
  }, [fullTestResult, isTestingConnection]);

  // Custom test connection handler that also shows popup
  const handleTestConnectionWithPopup = async () => {
    setShowResultPopup(false);
    
    // Call the original test connection logic
    await handleTestConnection();
  };

  const steps = [
    { number: 1, label: 'Application', completed: currentStep > 1, active: currentStep === 1 },
    { number: 2, label: 'Connection', completed: false, active: currentStep === 2 }
  ];

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" showCloseButton={false}>
      <div className="-m-6">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Create Application
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
        <StepIndicator steps={steps} />

        <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }} className="space-y-4">
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

          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
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
                  ref={testButtonRef}
                  type="button"
                  variant="secondary"
                  onClick={handleTestConnectionWithPopup}
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
              ) : null}

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
      </div>
      
      {/* Connection Test Result Popup */}
      {showResultPopup && detailedTestResult && (
        <ConnectionTestResultPopup
          isOpen={showResultPopup}
          onClose={() => setShowResultPopup(false)}
          testResult={detailedTestResult}
          databaseType={getDatabaseTypeOptions().find(opt => opt.value === selectedDbType)?.label || 'Unknown'}
          position={popupPosition}
        />
      )}
    </Modal>
  );
};

export default ApplicationWithConnectionModal;