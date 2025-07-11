import { useState } from 'react';
import { DatabaseType } from '../types';
import { databaseConnectionService } from '../services/databaseConnectionService';
import { useNotifications } from '../contexts/NotificationContext';

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

    try {
      const result = await databaseConnectionService.testConnection(data);
      
      if (result.isSuccessful) {
        setTestResult({ success: true, message: result.message || 'Connection successful!' });
        addNotification({
          title: 'Connection Test',
          message: 'Database connection test passed!',
          type: 'success',
          source: 'Database Test'
        });
      } else {
        setTestResult({ success: false, message: result.message || 'Connection failed' });
        addNotification({
          title: 'Connection Test',
          message: `Connection test failed: ${result.message}`,
          type: 'error',
          source: 'Database Test'
        });
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Connection test failed';
      setTestResult({ success: false, message: errorMessage });
      addNotification({
        title: 'Connection Test',
        message: `Connection test failed: ${errorMessage}`,
        type: 'error',
        source: 'Database Test'
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