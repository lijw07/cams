import React from 'react';

import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import DataInput from '../../components/migration/DataInput';
import MigrationResults from '../../components/migration/MigrationResults';
import MigrationTypeSelector from '../../components/migration/MigrationTypeSelector';
import { useBulkMigration } from '../../hooks/useBulkMigration';

const BulkMigration: React.FC = () => {
  const {
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
  } = useBulkMigration();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Bulk Migration
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Import users, roles, and applications from external data sources
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration Panel */}
        <div className="space-y-6">
          <Card>
            <MigrationTypeSelector
              selectedType={selectedType}
              onTypeChange={setSelectedType}
              dataFormat={dataFormat}
              onFormatChange={setDataFormat}
            />
          </Card>

          <Card>
            <DataInput
              importData={importData}
              onDataChange={setImportData}
              onFileUpload={handleFileUpload}
              onDownloadSample={downloadSample}
              isLoading={isLoading}
              dataFormat={dataFormat}
              selectedType={selectedType}
              overwriteExisting={overwriteExisting}
              onOverwriteChange={setOverwriteExisting}
              sendNotifications={sendNotifications}
              onNotificationsChange={setSendNotifications}
            />
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button
              onClick={validateMigration}
              disabled={!importData.trim() || isLoading || isImporting}
              loading={isLoading}
              variant="secondary"
              className="flex-1"
            >
              Validate Data
            </Button>
            
            <Button
              onClick={executeMigration}
              disabled={!validationResult?.IsValid || isLoading || isImporting}
              loading={isImporting}
              className="flex-1"
            >
              Execute Migration
            </Button>
            
            <Button
              onClick={resetForm}
              disabled={isLoading || isImporting}
              variant="secondary"
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Results Panel */}
        <MigrationResults
          validationResult={validationResult}
          migrationResult={migrationResult}
          currentProgress={currentProgress}
          showProgress={showProgress}
        />
      </div>
    </div>
  );
};

export default BulkMigration;