import React, { useState, useRef } from 'react';

import { X, Database, TestTube, CheckCircle, AlertCircle } from 'lucide-react';

import { useNotifications } from '../../contexts/NotificationContext';
import { useDatabaseConnectionModal } from '../../hooks/useDatabaseConnectionModal';
import { useModalStack } from '../../hooks/useModalStack';
import { databaseConnectionService } from '../../services/databaseConnectionService';
import { DatabaseConnectionRequest, DatabaseConnectionUpdateRequest, DatabaseConnection } from '../../types';
import { DatabaseConnectionFields } from '../forms/DatabaseConnectionFields';
import ConnectionTestResultPopup from '../ui/ConnectionTestResultPopup';

interface DatabaseConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DatabaseConnectionRequest | DatabaseConnectionUpdateRequest) => Promise<void>;
  applicationId: string;
  applicationName: string;
  connection?: DatabaseConnection;
  mode?: 'create' | 'edit';
}

const DatabaseConnectionModal: React.FC<DatabaseConnectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  applicationId,
  applicationName,
  connection,
  mode = 'create'
}) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [detailedTestResult, setDetailedTestResult] = useState<any>(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const testButtonRef = useRef<HTMLButtonElement>(null);
  const { addNotification } = useNotifications();
  
  // Register this modal with the modal stack
  useModalStack(isOpen, onClose);

  const {
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
    isConnectionStringType,
    getValues
  } = useDatabaseConnectionModal({
    isOpen,
    applicationId,
    connection,
    mode,
    onSubmit,
    onClose
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={mode === 'edit' ? undefined : handleClose}
        />

        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === 'edit' ? 'Edit Database Connection' : 'Add Database Connection'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {mode === 'edit' 
                  ? `Editing: ${connection?.Name}` 
                  : `Adding connection to: ${applicationName}`
                }
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Connection Details
              </h3>

              <DatabaseConnectionFields
                register={register}
                errors={errors}
                control={control}
                selectedDbType={selectedDbType}
                setSelectedDbType={setSelectedDbType}
                getDatabaseTypeOptions={getDatabaseTypeOptions}
                isApiType={isApiType}
                isConnectionStringType={isConnectionStringType}
              />

            </div>


            <div className="flex justify-end space-x-3 pt-4">
              <button
                ref={testButtonRef}
                type="button"
                onClick={async () => {
                  setTesting(true);
                  setTestResult(null);
                  setShowResultPopup(false);
                  
                  try {
                    const formValues = getValues();
                    console.log('DatabaseConnectionModal - Form values:', formValues);
                    const testData = {
                      // If we're editing an existing connection, include ConnectionId
                      ...(mode === 'edit' && connection ? { ConnectionId: connection.Id } : {}),
                      ConnectionDetails: {
                        ApplicationId: applicationId,
                        Name: formValues.Name || 'Test Connection',
                        Description: formValues.Description,
                        Type: selectedDbType,
                        Server: formValues.Server,
                        Port: formValues.Port,
                        Database: formValues.Database,
                        Username: formValues.Username,
                        Password: formValues.Password,
                        ConnectionString: formValues.ConnectionString,
                        ApiBaseUrl: formValues.ApiBaseUrl,
                        ApiKey: formValues.ApiKey,
                        AdditionalSettings: formValues.AdditionalSettings,
                        IsActive: formValues.IsActive ?? true
                      }
                    };
                    console.log('DatabaseConnectionModal - Test data:', testData);
                    const result = await databaseConnectionService.testConnection(testData);
                    console.log('DatabaseConnectionModal - Test result:', result);
                    
                    setTestResult({
                      success: result.IsSuccessful,
                      message: result.Message || 'Connection successful'
                    });
                    
                    // Store detailed result and show popup
                    setDetailedTestResult(result);
                    
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
                    
                  } catch (error) {
                    console.error('Test connection error:', error);
                    const errorMessage = error instanceof Error ? error.message : 'Failed to test connection';
                    
                    // Extract error details from response
                    let errorCode = 'NETWORK_ERROR';
                    let errorDetails = '';
                    if (error && typeof error === 'object' && 'response' in error) {
                      const response = (error as any).response;
                      if (response?.data?.ErrorCode) {
                        errorCode = response.data.ErrorCode;
                      }
                      if (response?.data?.Message) {
                        errorDetails = response.data.Message;
                      }
                    }
                    
                    const failedResult = {
                      IsSuccessful: false,
                      Message: errorMessage,
                      ErrorCode: errorCode,
                      ErrorDetails: errorDetails
                    };
                    
                    setTestResult({
                      success: false,
                      message: errorMessage
                    });
                    
                    // Store detailed result and show popup
                    setDetailedTestResult(failedResult);
                    
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
                  } finally {
                    setTesting(false);
                  }
                }}
                disabled={testing || isSubmitting}
                className={`btn ${
                  testResult 
                    ? testResult.success 
                      ? 'btn-outline border-green-500 text-green-600 hover:bg-green-50' 
                      : 'btn-outline border-red-500 text-red-600 hover:bg-red-50'
                    : 'btn-outline'
                }`}
                title={testResult ? testResult.message : undefined}
              >
                {testing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
                    Testing...
                  </>
                ) : testResult ? (
                  testResult.success ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Connection Successful
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Connection Failed
                    </>
                  )
                ) : (
                  <>
                    <TestTube className="w-4 h-4 mr-2" />
                    Test Connection
                  </>
                )}
              </button>
              
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? (mode === 'edit' ? 'Updating...' : 'Creating...') 
                  : (mode === 'edit' ? 'Update Connection' : 'Add Connection')
                }
              </button>
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
    </div>
  );
};

export default DatabaseConnectionModal;