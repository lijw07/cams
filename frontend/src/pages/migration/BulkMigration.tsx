import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Download, FileText, CheckCircle, XCircle, AlertCircle, Users, Shield, Package } from 'lucide-react';
import { migrationService } from '../../services/migrationService';
import { signalRService } from '../../services/signalRService';
import { BulkMigrationRequest, MigrationResult, MigrationValidationResult, MigrationProgress } from '../../types';
import ProgressTracker from '../../components/ui/ProgressTracker';
import { useNotifications } from '../../contexts/NotificationContext';

const BulkMigration: React.FC = () => {
  const [selectedType, setSelectedType] = useState<'Users' | 'Roles' | 'Applications'>('Users');
  const [dataFormat, setDataFormat] = useState<'JSON' | 'CSV'>('JSON');
  const [importData, setImportData] = useState('');
  const [validateOnly] = useState(true);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [sendNotifications, setSendNotifications] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<MigrationValidationResult | null>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [currentProgress, setCurrentProgress] = useState<MigrationProgress | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { addNotification } = useNotifications();

  const migrationTypes = [
    { value: 'Users' as const, label: 'Users', icon: Users, description: 'Import user accounts with roles and permissions' },
    { value: 'Roles' as const, label: 'Roles', icon: Shield, description: 'Import roles and permission assignments' },
    { value: 'Applications' as const, label: 'Applications', icon: Package, description: 'Import application configurations' }
  ];

  // SignalR progress update handler
  const handleProgressUpdate = useCallback((progress: MigrationProgress) => {
    setCurrentProgress(progress);
    
    if (progress.isCompleted) {
      setIsImporting(false);
      setShowProgress(false);
      if (progress.isSuccessful) {
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
  }, []);

  // Setup SignalR connection
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      
      if (file.name.endsWith('.csv')) {
        setDataFormat('CSV');
        setImportData(content);
      } else if (file.name.endsWith('.json')) {
        setDataFormat('JSON');
        if (migrationService.validateJSON(content)) {
          setImportData(content);
        } else {
          addNotification({ 
            title: 'Error', 
            message: 'Invalid JSON format', 
            type: 'error', 
            source: 'BulkMigration' 
          });
        }
      } else {
        addNotification({ 
          title: 'Error', 
          message: 'Please upload a CSV or JSON file', 
          type: 'error', 
          source: 'BulkMigration' 
        });
      }
    };
    reader.readAsText(file);
  };

  const handleLoadExample = () => {
    let exampleData;
    switch (selectedType) {
      case 'Users':
        exampleData = migrationService.generateExampleUsers();
        break;
      case 'Roles':
        exampleData = migrationService.generateExampleRoles();
        break;
      case 'Applications':
        exampleData = migrationService.generateExampleApplications();
        break;
    }
    setImportData(JSON.stringify(exampleData, null, 2));
    setDataFormat('JSON');
  };

  const handleDownloadTemplate = async () => {
    try {
      const template = await migrationService.getTemplate(selectedType.toLowerCase() as any);
      migrationService.downloadJSON(template, `${selectedType.toLowerCase()}-template.json`);
      addNotification({ 
        title: 'Success', 
        message: 'Template downloaded successfully', 
        type: 'success', 
        source: 'BulkMigration' 
      });
    } catch (error) {
      addNotification({ 
        title: 'Error', 
        message: 'Failed to download template', 
        type: 'error', 
        source: 'BulkMigration' 
      });
    }
  };

  const handleValidate = async () => {
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
    setMigrationResult(null);

    try {
      const request: BulkMigrationRequest = {
        migrationType: selectedType,
        data: importData,
        dataFormat,
        validateOnly: true,
        overwriteExisting,
        sendNotifications
      };

      const result = await migrationService.validateMigration(request);
      setValidationResult(result);

      if (result.isValid) {
        addNotification({ 
          title: 'Success', 
          message: 'Validation completed successfully', 
          type: 'success', 
          source: 'BulkMigration' 
        });
      } else {
        addNotification({ 
          title: 'Error', 
          message: `Validation failed with ${result.errors.length} errors`, 
          type: 'error', 
          source: 'BulkMigration' 
        });
      }
    } catch (error: any) {
      addNotification({ 
        title: 'Error', 
        message: error.response?.data?.message || 'Validation failed', 
        type: 'error', 
        source: 'BulkMigration' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importData.trim()) {
      addNotification({ 
        title: 'Error', 
        message: 'Please provide data to import', 
        type: 'error', 
        source: 'BulkMigration' 
      });
      return;
    }

    if (!validationResult?.isValid) {
      addNotification({ 
        title: 'Error', 
        message: 'Please validate the data first', 
        type: 'error', 
        source: 'BulkMigration' 
      });
      return;
    }

    setIsLoading(true);
    setIsImporting(true);
    setMigrationResult(null);
    setCurrentProgress(null);
    setShowProgress(true);

    try {
      const request: BulkMigrationRequest = {
        migrationType: selectedType,
        data: importData,
        dataFormat,
        validateOnly: false,
        overwriteExisting,
        sendNotifications
      };

      const result = await migrationService.importData(request);
      setMigrationResult(result);

      // Join the SignalR group for this migration if we have a progressId
      if (result.progressId) {
        try {
          await signalRService.joinMigrationGroup(result.progressId);
        } catch (error) {
          console.error('Failed to join migration group:', error);
        }
      }

      if (result.success) {
        addNotification({ 
          title: 'Success', 
          message: `Successfully imported ${result.successfulRecords} ${selectedType.toLowerCase()}`, 
          type: 'success', 
          source: 'BulkMigration' 
        });
      } else {
        addNotification({ 
          title: 'Error', 
          message: `Import completed with ${result.errors.length} errors`, 
          type: 'error', 
          source: 'BulkMigration' 
        });
      }
    } catch (error: any) {
      addNotification({ 
        title: 'Error', 
        message: error.response?.data?.message || 'Import failed', 
        type: 'error', 
        source: 'BulkMigration' 
      });
      setIsImporting(false);
      setShowProgress(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bulk Migration</h1>
        <p className="text-gray-600 dark:text-gray-400">Import users, roles, and applications from CSV or JSON files</p>
      </div>

      {/* Migration Type Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Migration Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {migrationTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                selectedType === type.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <type.icon className={`w-6 h-6 ${
                  selectedType === type.value ? 'text-primary-600' : 'text-gray-500'
                }`} />
                <span className={`font-medium ${
                  selectedType === type.value ? 'text-primary-900 dark:text-primary-100' : 'text-gray-900 dark:text-white'
                }`}>
                  {type.label}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{type.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Data Input Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Import Data</h3>
          <div className="flex space-x-2">
            <button
              onClick={handleLoadExample}
              className="btn btn-secondary btn-sm"
            >
              <FileText className="w-4 h-4 mr-2" />
              Load Example
            </button>
            <button
              onClick={handleDownloadTemplate}
              className="btn btn-secondary btn-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload File
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">CSV or JSON files only</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".csv,.json"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>

          {/* Data Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data Format
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="JSON"
                  checked={dataFormat === 'JSON'}
                  onChange={(e) => setDataFormat(e.target.value as 'JSON' | 'CSV')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">JSON</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="CSV"
                  checked={dataFormat === 'CSV'}
                  onChange={(e) => setDataFormat(e.target.value as 'JSON' | 'CSV')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">CSV</span>
              </label>
            </div>
          </div>

          {/* Data Textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data Content
            </label>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              rows={10}
              className="input font-mono text-sm"
              placeholder={`Paste your ${dataFormat} data here or upload a file...`}
            />
          </div>
        </div>
      </div>

      {/* Options Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Import Options</h3>
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={overwriteExisting}
              onChange={(e) => setOverwriteExisting(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Overwrite existing records
            </span>
          </label>
          
          {selectedType === 'Users' && (
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={sendNotifications}
                onChange={(e) => setSendNotifications(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Send welcome emails to new users
              </span>
            </label>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={handleValidate}
          disabled={isLoading || !importData.trim()}
          className="btn btn-secondary"
        >
          {isLoading && validateOnly ? 'Validating...' : 'Validate Data'}
        </button>
        <button
          onClick={handleImport}
          disabled={isLoading || !importData.trim() || !validationResult?.isValid}
          className="btn btn-primary"
        >
          {isLoading && !validateOnly ? 'Importing...' : `Import ${selectedType}`}
        </button>
      </div>

      {/* Validation Results */}
      {validationResult && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            {validationResult.isValid ? (
              <CheckCircle className="w-6 h-6 text-success-600" />
            ) : (
              <XCircle className="w-6 h-6 text-error-600" />
            )}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Validation Results
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{validationResult.totalRecords}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Records</div>
            </div>
            <div className="text-center p-4 bg-error-50 dark:bg-error-900/20 rounded-lg">
              <div className="text-2xl font-bold text-error-600">{validationResult.errors.length}</div>
              <div className="text-sm text-error-600">Errors</div>
            </div>
            <div className="text-center p-4 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
              <div className="text-2xl font-bold text-warning-600">{validationResult.warnings.length}</div>
              <div className="text-sm text-warning-600">Warnings</div>
            </div>
          </div>

          {validationResult.errors.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-error-600 mb-2">Errors:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-error-600 bg-error-50 dark:bg-error-900/20 p-3 rounded">
                {validationResult.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {validationResult.warnings.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-warning-600 mb-2">Warnings:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-warning-600 bg-warning-50 dark:bg-warning-900/20 p-3 rounded">
                {validationResult.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Progress Tracker */}
      <ProgressTracker
        progress={currentProgress}
        isVisible={showProgress && isImporting}
        className="sticky top-4 z-10"
      />

      {/* Migration Results */}
      {migrationResult && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            {migrationResult.success ? (
              <CheckCircle className="w-6 h-6 text-success-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-warning-600" />
            )}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Migration Results
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{migrationResult.totalRecords}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
            </div>
            <div className="text-center p-4 bg-success-50 dark:bg-success-900/20 rounded-lg">
              <div className="text-2xl font-bold text-success-600">{migrationResult.successfulRecords}</div>
              <div className="text-sm text-success-600">Success</div>
            </div>
            <div className="text-center p-4 bg-error-50 dark:bg-error-900/20 rounded-lg">
              <div className="text-2xl font-bold text-error-600">{migrationResult.failedRecords}</div>
              <div className="text-sm text-error-600">Failed</div>
            </div>
            <div className="text-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <div className="text-2xl font-bold text-primary-600">{migrationResult.duration}</div>
              <div className="text-sm text-primary-600">Duration</div>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">{migrationResult.message}</p>
          </div>

          {migrationResult.errors.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-error-600 mb-2">Errors:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-error-600 bg-error-50 dark:bg-error-900/20 p-3 rounded">
                {migrationResult.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {migrationResult.warnings.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-warning-600 mb-2">Warnings:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-warning-600 bg-warning-50 dark:bg-warning-900/20 p-3 rounded">
                {migrationResult.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkMigration;