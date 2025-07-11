import { useState, useCallback } from 'react';
import { migrationService } from '../services/migrationService';
import { BulkMigrationRequest, MigrationResult } from '../types';
import { useNotifications } from '../contexts/NotificationContext';

/**
 * Hook for managing migration execution
 * Handles the actual migration process and result state
 */
export const useMigrationExecution = () => {
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const { addNotification } = useNotifications();

  const executeMigration = useCallback(async (
    selectedType: 'Users' | 'Roles' | 'Applications',
    dataFormat: 'JSON' | 'CSV',
    importData: string,
    overwriteExisting: boolean,
    sendNotifications: boolean
  ) => {
    if (!importData.trim()) {
      addNotification({ 
        title: 'Error', 
        message: 'Please provide data to import', 
        type: 'error', 
        source: 'BulkMigration' 
      });
      return false;
    }

    setIsImporting(true);
    setShowProgress(true);
    setMigrationResult(null);

    try {
      const request: BulkMigrationRequest = {
        MigrationType: selectedType,
        DataFormat: dataFormat,
        Data: importData,
        ValidateOnly: false,
        OverwriteExisting: overwriteExisting,
        SendNotifications: sendNotifications
      };

      const result = await migrationService.executeMigration(request);
      setMigrationResult(result);
      
      if (result.IsSuccessful) {
        addNotification({
          title: 'Import Successful',
          message: `Successfully imported ${result.ImportedCount} records`,
          type: 'success',
          source: 'BulkMigration'
        });
      } else {
        addNotification({
          title: 'Import Completed with Errors',
          message: `Imported ${result.ImportedCount} records with ${result.ErrorCount} errors`,
          type: 'warning',
          source: 'BulkMigration'
        });
      }
      
      return result.IsSuccessful;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Import failed';
      addNotification({ 
        title: 'Error', 
        message: errorMessage, 
        type: 'error', 
        source: 'BulkMigration' 
      });
      return false;
    } finally {
      setIsImporting(false);
      setShowProgress(false);
    }
  }, [addNotification]);

  const clearResults = useCallback(() => {
    setMigrationResult(null);
    setShowProgress(false);
  }, []);

  return {
    migrationResult,
    isImporting,
    showProgress,
    executeMigration,
    clearResults
  };
};