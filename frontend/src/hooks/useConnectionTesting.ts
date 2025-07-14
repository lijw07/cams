import { useState, useCallback } from 'react';

import { useNotifications } from '../contexts/NotificationContext';
import { databaseConnectionService } from '../services/databaseConnectionService';
import { ApplicationWithConnectionRequest, DatabaseType } from '../types';


interface TestResult {
  success: boolean;
  message: string;
}

/**
 * Hook for managing database connection testing
 * Handles connection test logic and result state
 */
export const useConnectionTesting = () => {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const { addNotification } = useNotifications();

  const clearTestResult = useCallback(() => {
    setTestResult(null);
  }, []);

  const testConnection = useCallback(async (
    formData: ApplicationWithConnectionRequest,
    selectedDbType: DatabaseType
  ) => {
    // Import utility function instead of using hook
    const { getDatabaseTypeInfo } = await import('../utils/databaseTypeUtils');
    const { isConnectionStringType, isCloudPlatform, isApiType } = getDatabaseTypeInfo(selectedDbType);

    setIsTestingConnection(true);
    setTestResult(null);

    try {
      // Show immediate notification that test is starting
      addNotification({
        title: 'Testing Connection',
        message: 'Attempting to connect to the database...',
        type: 'info',
        source: 'Database Connection',
        details: 'This process may take a few seconds depending on your network and database configuration.',
        isPersistent: true
      });

      // Check if connection testing is available for this type
      if (isConnectionStringType) {
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
        return;
      }

      // Prepare test data based on database type
      let testData;
      
      if (isCloudPlatform) {
        testData = {
          DatabaseType: formData.DatabaseType,
          Server: formData.Server || formData.ApiBaseUrl || '',
          Database: formData.Database || '',
          Username: formData.Username || formData.ClientId || '',
          Password: formData.Password || formData.ClientSecret || formData.ApiKey || ''
        };
      } else if (isApiType) {
        testData = {
          DatabaseType: formData.DatabaseType,
          Server: formData.ApiBaseUrl || '',
          ApiKey: formData.ApiKey || '',
          Username: formData.Username || '',
          Password: formData.Password || ''
        };
      } else {
        testData = {
          DatabaseType: formData.DatabaseType,
          Server: formData.Server || '',
          Database: formData.Database || '',
          Username: formData.Username || '',
          Password: formData.Password || '',
          Port: formData.Port
        };
      }

      const result = await databaseConnectionService.testConnection(testData);
      
      if (result.IsSuccessful) {
        const successResult = { 
          success: true, 
          message: result.Message || 'Connection successful!' 
        };
        setTestResult(successResult);
        
        addNotification({
          title: 'Connection Test Successful',
          message: 'Successfully connected to the database',
          type: 'success',
          source: 'Database Connection',
          details: `Connection established in ${result.Duration || 'unknown'} ms. ${result.AdditionalInfo ? JSON.stringify(result.AdditionalInfo) : ''}`,
          suggestions: [
            'You can now proceed with creating the application',
            'Consider testing the connection periodically to monitor its status',
            'Save this connection configuration for future use'
          ]
        });
      } else {
        const failureResult = { 
          success: false, 
          message: result.Message || 'Connection failed' 
        };
        setTestResult(failureResult);
        
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      const errorResult = { success: false, message: errorMessage };
      setTestResult(errorResult);
      
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
  }, [addNotification]);

  return {
    isTestingConnection,
    testResult,
    testConnection,
    clearTestResult
  };
};