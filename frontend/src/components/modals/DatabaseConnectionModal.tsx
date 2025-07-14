import React, { useState } from 'react';

import { X, Database, TestTube, CheckCircle, AlertCircle } from 'lucide-react';

import { useNotifications } from '../../contexts/NotificationContext';
import { useDatabaseConnectionModal } from '../../hooks/useDatabaseConnectionModal';
import { databaseConnectionService } from '../../services/databaseConnectionService';
import { DatabaseConnectionRequest, DatabaseConnectionUpdateRequest, DatabaseConnection } from '../../types';
import { DatabaseConnectionFields } from '../forms/DatabaseConnectionFields';

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
  const { addNotification } = useNotifications();

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
          onClick={handleClose}
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

            {/* Test Result Display */}
            {testResult && (
              <div className={`mt-4 p-3 rounded-md ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center">
                  {testResult.success ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                  )}
                  <p className={`text-sm ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    {testResult.message}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={async () => {
                  setTesting(true);
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
                    const formValues = getValues();
                    console.log('DatabaseConnectionModal - Form values:', formValues);
                    const testData = {
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
                        IsActive: true
                      }
                    };
                    console.log('DatabaseConnectionModal - Test data:', testData);
                    const result = await databaseConnectionService.testConnection(testData);
                    console.log('DatabaseConnectionModal - Test result:', result);
                    
                    setTestResult({
                      success: result.IsSuccessful,
                      message: result.Message || 'Connection successful'
                    });
                    
                    if (result.IsSuccessful) {
                      addNotification({
                        title: 'Connection Test Successful',
                        message: 'Successfully connected to the database',
                        type: 'success',
                        source: 'Database Connection',
                        details: `Connection established in ${result.Duration || 'unknown'} ms. ${result.AdditionalInfo ? JSON.stringify(result.AdditionalInfo) : ''}`,
                        suggestions: [
                          'You can now save this connection configuration',
                          'Test the connection periodically to ensure it remains accessible'
                        ]
                      });
                    } else {
                      // Extract error code from result
                      const errorCode = result.ErrorCode || 'UNKNOWN_ERROR';
                      const errorMessage = result.Message || 'Connection failed';
                      
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
                  } catch (error) {
                    console.error('Test connection error:', error);
                    const errorMessage = error instanceof Error ? error.message : 'Failed to test connection';
                    
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
                    
                    setTestResult({
                      success: false,
                      message: errorMessage
                    });
                    
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
                    setTesting(false);
                  }
                }}
                disabled={testing || isSubmitting}
                className="btn btn-outline"
              >
                {testing ? (
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
    </div>
  );
};

export default DatabaseConnectionModal;