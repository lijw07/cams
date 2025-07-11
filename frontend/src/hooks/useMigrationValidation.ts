import { useState, useCallback } from 'react';

import { useNotifications } from '../contexts/NotificationContext';
import { migrationService } from '../services/migrationService';
import { BulkMigrationRequest, MigrationValidationResult } from '../types';

/**
 * Hook for managing migration data validation
 * Handles validation requests and result state
 */
export const useMigrationValidation = () => {
  const [validationResult, setValidationResult] = useState<MigrationValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const { addNotification } = useNotifications();

  const validateMigration = useCallback(async (
    selectedType: 'Users' | 'Roles' | 'Applications',
    dataFormat: 'JSON' | 'CSV',
    importData: string,
    overwriteExisting: boolean,
    sendNotifications: boolean
  ) => {
    if (!importData.trim()) {
      addNotification({ 
        title: 'Error', 
        message: 'Please provide data to validate', 
        type: 'error', 
        source: 'BulkMigration' 
      });
      return false;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const request: BulkMigrationRequest = {
        MigrationType: selectedType,
        DataFormat: dataFormat,
        Data: importData,
        ValidateOnly: true,
        OverwriteExisting: overwriteExisting,
        SendNotifications: sendNotifications
      };

      const result = await migrationService.validateMigration(request);
      setValidationResult(result);
      
      if (result.IsValid) {
        addNotification({
          title: 'Validation Successful',
          message: `Found ${result.ValidRecords} valid records`,
          type: 'success',
          source: 'BulkMigration'
        });
      } else {
        addNotification({
          title: 'Validation Failed',
          message: `Found ${result.Errors?.length || 0} validation errors`,
          type: 'error',
          source: 'BulkMigration'
        });
      }
      
      return result.IsValid;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      addNotification({ 
        title: 'Error', 
        message: errorMessage, 
        type: 'error', 
        source: 'BulkMigration' 
      });
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [addNotification]);

  const clearValidation = useCallback(() => {
    setValidationResult(null);
  }, []);

  return {
    validationResult,
    isValidating,
    validateMigration,
    clearValidation
  };
};