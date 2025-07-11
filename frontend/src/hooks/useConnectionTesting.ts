import { useState, useCallback } from 'react';
import { ApplicationWithConnectionRequest, DatabaseType } from '../types';
import { databaseConnectionService } from '../services/databaseConnectionService';
import { useNotifications } from '../contexts/NotificationContext';
import { useDatabaseTypeUtils } from './useDatabaseTypeUtils';

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
    const { isConnectionStringType, isCloudPlatform, isApiType } = useDatabaseTypeUtils(selectedDbType);

    setIsTestingConnection(true);
    setTestResult(null);

    try {
      // Check if connection testing is available for this type
      if (isConnectionStringType) {
        addNotification({
          title: 'Connection Test Unavailable',
          message: 'Connection testing not available for custom connection strings',
          type: 'error',
          source: 'Database Connection'
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
          message: 'Database connection test passed!',
          type: 'success',
          source: 'Database Connection'
        });
      } else {
        const failureResult = { 
          success: false, 
          message: result.Message || 'Connection failed' 
        };
        setTestResult(failureResult);
        
        addNotification({
          title: 'Connection Test Failed',
          message: `Connection test failed: ${result.Message}`,
          type: 'error',
          source: 'Database Connection'
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      const errorResult = { success: false, message: errorMessage };
      setTestResult(errorResult);
      
      addNotification({
        title: 'Connection Test Failed',
        message: `Connection test failed: ${errorMessage}`,
        type: 'error',
        source: 'Database Connection'
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