import { useState } from 'react';

import { useNotifications } from '../contexts/NotificationContext';
import { databaseConnectionService } from '../services/databaseConnectionService';
import { DatabaseType } from '../types';

export interface ConnectionTestData {
  DatabaseType: DatabaseType;
  Server: string;
  Database: string;
  Username: string;
  Password: string;
  Port?: number;
  ConnectionString?: string;
  ApiBaseUrl?: string;
  ApiKey?: string;
}

export interface UseConnectionTestReturn {
  isTestingConnection: boolean;
  testResult: { success: boolean; message: string } | null;
  testConnection: (data: ConnectionTestData) => Promise<void>;
  clearTestResult: () => void;
}

export const useConnectionTest = (): UseConnectionTestReturn => {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const { addNotification } = useNotifications();

  const testConnection = async (data: ConnectionTestData) => {
    setIsTestingConnection(true);
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
      const result = await databaseConnectionService.testConnection(data);
      
      if (result.IsSuccessful) {
        setTestResult({ success: true, message: result.Message || 'Connection successful!' });
        addNotification({
          title: 'Connection Test Successful',
          message: 'Successfully connected to the database',
          type: 'success',
          source: 'Database Connection',
          details: `Connection established in ${result.Duration || 'unknown'} ms. ${result.AdditionalInfo ? JSON.stringify(result.AdditionalInfo) : ''}`,
          suggestions: [
            'You can now save this connection configuration',
            'Consider testing the connection periodically to monitor its status',
            'Verify all application features work with this connection'
          ]
        });
      } else {
        setTestResult({ success: false, message: result.Message || 'Connection failed' });
        
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
    } catch (error: any) {
      const errorMessage = error?.message || 'Connection test failed';
      setTestResult({ success: false, message: errorMessage });
      
      // Try to extract error code from the error response
      let errorCode = 'NETWORK_ERROR';
      if (error && typeof error === 'object' && 'response' in error) {
        const response = error.response;
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
  };

  const clearTestResult = () => {
    setTestResult(null);
  };

  return {
    isTestingConnection,
    testResult,
    testConnection,
    clearTestResult
  };
};