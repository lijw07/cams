import { useState, useEffect, useCallback } from 'react';
import { signalRService } from '../services/signalRService';
import { MigrationProgress } from '../types';
import { useNotifications } from '../contexts/NotificationContext';

/**
 * Hook for managing SignalR connection and migration progress updates
 * Handles real-time progress notifications during migration
 */
export const useMigrationSignalR = () => {
  const [currentProgress, setCurrentProgress] = useState<MigrationProgress | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { addNotification } = useNotifications();

  const handleProgressUpdate = useCallback((progress: MigrationProgress) => {
    setCurrentProgress(progress);
    
    if (progress.IsCompleted) {
      if (progress.IsSuccessful) {
        addNotification({ 
          title: 'Success', 
          message: 'Migration completed successfully!', 
          type: 'success', 
          source: 'BulkMigration' 
        });
      } else {
        addNotification({ 
          title: 'Error', 
          message: 'Migration completed with errors', 
          type: 'error', 
          source: 'BulkMigration' 
        });
      }
    }
  }, [addNotification]);

  const connectSignalR = useCallback(async () => {
    try {
      await signalRService.connect();
      signalRService.onProgressUpdate(handleProgressUpdate);
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to setup SignalR:', error);
      setIsConnected(false);
      addNotification({
        title: 'Connection Error',
        message: 'Failed to establish real-time connection',
        type: 'warning',
        source: 'BulkMigration'
      });
    }
  }, [handleProgressUpdate, addNotification]);

  const disconnectSignalR = useCallback(() => {
    signalRService.offProgressUpdate(handleProgressUpdate);
    signalRService.disconnect();
    setIsConnected(false);
    setCurrentProgress(null);
  }, [handleProgressUpdate]);

  useEffect(() => {
    connectSignalR();
    return disconnectSignalR;
  }, [connectSignalR, disconnectSignalR]);

  const clearProgress = useCallback(() => {
    setCurrentProgress(null);
  }, []);

  return {
    currentProgress,
    isConnected,
    clearProgress,
    reconnect: connectSignalR
  };
};