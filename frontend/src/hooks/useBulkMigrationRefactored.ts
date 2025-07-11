import { useState } from 'react';
import { useFileUpload } from './useFileUpload';
import { useMigrationSignalR } from './useMigrationSignalR';
import { useMigrationValidation } from './useMigrationValidation';
import { useMigrationExecution } from './useMigrationExecution';

/**
 * Refactored bulk migration hook using composition
 * Now under 100 lines per CLAUDE.md standards
 * Combines smaller focused hooks for better maintainability
 */
export const useBulkMigrationRefactored = () => {
  // Migration configuration state
  const [selectedType, setSelectedType] = useState<'Users' | 'Roles' | 'Applications'>('Users');
  const [dataFormat, setDataFormat] = useState<'JSON' | 'CSV'>('JSON');
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [sendNotifications, setSendNotifications] = useState(true);

  // Use composed hooks
  const fileUpload = useFileUpload();
  const signalR = useMigrationSignalR();
  const validation = useMigrationValidation();
  const execution = useMigrationExecution();

  const handleFileUpload = (file: File) => {
    fileUpload.handleFileUpload(file);
    validation.clearValidation();
    execution.clearResults();
  };

  const handleDataChange = (data: string) => {
    fileUpload.updateData(data);
    validation.clearValidation();
    execution.clearResults();
  };

  const validateMigration = async () => {
    return await validation.validateMigration(
      selectedType,
      dataFormat,
      fileUpload.importData,
      overwriteExisting,
      sendNotifications
    );
  };

  const executeMigration = async () => {
    return await execution.executeMigration(
      selectedType,
      dataFormat,
      fileUpload.importData,
      overwriteExisting,
      sendNotifications
    );
  };

  const resetAll = () => {
    fileUpload.clearData();
    validation.clearValidation();
    execution.clearResults();
    signalR.clearProgress();
  };

  return {
    // Configuration state
    selectedType,
    setSelectedType,
    dataFormat,
    setDataFormat,
    overwriteExisting,
    setOverwriteExisting,
    sendNotifications,
    setSendNotifications,

    // File upload
    importData: fileUpload.importData,
    isLoadingFile: fileUpload.isLoading,
    handleFileUpload,
    handleDataChange,

    // Validation
    validationResult: validation.validationResult,
    isValidating: validation.isValidating,
    validateMigration,

    // Execution
    migrationResult: execution.migrationResult,
    isImporting: execution.isImporting,
    showProgress: execution.showProgress,
    executeMigration,

    // SignalR progress
    currentProgress: signalR.currentProgress,
    isSignalRConnected: signalR.isConnected,

    // Utilities
    resetAll
  };
};