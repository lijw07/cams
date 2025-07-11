import { useState, useEffect, useCallback } from 'react';
import { migrationService } from '../services/migrationService';
import { signalRService } from '../services/signalRService';
import { BulkMigrationRequest, MigrationResult, MigrationValidationResult, MigrationProgress } from '../types';
import { useNotifications } from '../contexts/NotificationContext';

export const useBulkMigration = () => {
  const [selectedType, setSelectedType] = useState<'Users' | 'Roles' | 'Applications'>('Users');
  const [dataFormat, setDataFormat] = useState<'JSON' | 'CSV'>('JSON');
  const [importData, setImportData] = useState('');
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [sendNotifications, setSendNotifications] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<MigrationValidationResult | null>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [currentProgress, setCurrentProgress] = useState<MigrationProgress | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { addNotification } = useNotifications();

  const handleProgressUpdate = useCallback((progress: MigrationProgress) => {
    setCurrentProgress(progress);
    
    if (progress.IsCompleted) {
      setIsImporting(false);
      setShowProgress(false);
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

  useEffect(() => {
    const setupSignalR = async () => {
      try {
        await signalRService.connect();
        signalRService.onProgressUpdate(handleProgressUpdate);
      } catch (error) {
        console.error('Failed to setup SignalR:', error);
      }
    };

    setupSignalR();

    return () => {
      signalRService.offProgressUpdate(handleProgressUpdate);
      signalRService.disconnect();
    };
  }, [handleProgressUpdate]);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);
      setValidationResult(null);
      setMigrationResult(null);
    };
    reader.readAsText(file);
  };

  const validateMigration = async () => {
    if (!importData.trim()) {
      addNotification({ 
        title: 'Error', 
        message: 'Please provide data to validate', 
        type: 'error', 
        source: 'BulkMigration' 
      });
      return;
    }

    setIsLoading(true);
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
    } catch (error) {
      addNotification({ 
        title: 'Validation Error', 
        message: 'Failed to validate migration data', 
        type: 'error', 
        source: 'BulkMigration' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const executeMigration = async () => {
    if (!validationResult?.IsValid) {
      addNotification({ 
        title: 'Error', 
        message: 'Please validate the data first', 
        type: 'error', 
        source: 'BulkMigration' 
      });
      return;
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

      const result = await migrationService.importData(request);
      setMigrationResult(result);
    } catch (error) {
      setIsImporting(false);
      setShowProgress(false);
      addNotification({ 
        title: 'Migration Error', 
        message: 'Failed to execute migration', 
        type: 'error', 
        source: 'BulkMigration' 
      });
    }
  };

  const downloadSample = async () => {
    try {
      setIsLoading(true);
      // Generate sample data based on type
      let sampleData: any;
      switch (selectedType) {
        case 'Users':
          sampleData = migrationService.generateExampleUsers();
          break;
        case 'Roles':
          sampleData = migrationService.generateExampleRoles();
          break;
        case 'Applications':
          sampleData = migrationService.generateExampleApplications();
          break;
        default:
          throw new Error('Invalid type');
      }
      
      // Convert to requested format and download
      if (dataFormat === 'JSON') {
        migrationService.downloadJSON(sampleData, `${selectedType.toLowerCase()}_sample.json`);
      } else {
        const data = sampleData[selectedType] || [];
        migrationService.convertToCSV(data, `${selectedType.toLowerCase()}_sample.csv`);
      }
      
      addNotification({ 
        title: 'Success', 
        message: 'Sample file downloaded successfully', 
        type: 'success', 
        source: 'BulkMigration' 
      });
    } catch (error) {
      addNotification({ 
        title: 'Error', 
        message: 'Failed to download sample file', 
        type: 'error', 
        source: 'BulkMigration' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setImportData('');
    setValidationResult(null);
    setMigrationResult(null);
    setCurrentProgress(null);
    setShowProgress(false);
    setIsImporting(false);
  };

  return {
    selectedType,
    setSelectedType,
    dataFormat,
    setDataFormat,
    importData,
    setImportData,
    overwriteExisting,
    setOverwriteExisting,
    sendNotifications,
    setSendNotifications,
    isLoading,
    validationResult,
    migrationResult,
    currentProgress,
    showProgress,
    isImporting,
    handleFileUpload,
    validateMigration,
    executeMigration,
    downloadSample,
    resetForm
  };
};