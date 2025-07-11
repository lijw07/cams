import React, { useRef } from 'react';
import { Upload, Download, FileText } from 'lucide-react';
import Button from '../common/Button';
import Textarea from '../common/Textarea';

interface DataInputProps {
  importData: string;
  onDataChange: (data: string) => void;
  onFileUpload: (file: File) => void;
  onDownloadSample: () => void;
  isLoading: boolean;
  dataFormat: 'JSON' | 'CSV';
  selectedType: 'Users' | 'Roles' | 'Applications';
  overwriteExisting: boolean;
  onOverwriteChange: (value: boolean) => void;
  sendNotifications: boolean;
  onNotificationsChange: (value: boolean) => void;
}

const DataInput: React.FC<DataInputProps> = ({
  importData,
  onDataChange,
  onFileUpload,
  onDownloadSample,
  isLoading,
  dataFormat,
  selectedType: _selectedType, // eslint-disable-line no-unused-vars
  overwriteExisting,
  onOverwriteChange,
  sendNotifications,
  onNotificationsChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Import Data
        </h3>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <Button
            type="button"
            variant="secondary"
            onClick={triggerFileUpload}
            disabled={isLoading}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload File
          </Button>
          
          <Button
            type="button"
            variant="secondary"
            onClick={onDownloadSample}
            disabled={isLoading}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Sample
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={dataFormat === 'JSON' ? '.json' : '.csv'}
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {dataFormat} Data
          </label>
          <Textarea
            value={importData}
            onChange={(e) => onDataChange(e.target.value)}
            placeholder={`Paste your ${dataFormat} data here or upload a file...`}
            rows={12}
            className="font-mono text-sm"
          />
        </div>

        {importData && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <FileText className="w-4 h-4 inline mr-1" />
            {importData.split('\n').length} lines of data
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Import Options
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="overwriteExisting"
              checked={overwriteExisting}
              onChange={(e) => onOverwriteChange(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="overwriteExisting" className="ml-2 block text-sm text-gray-900 dark:text-white">
              Overwrite existing records
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="sendNotifications"
              checked={sendNotifications}
              onChange={(e) => onNotificationsChange(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="sendNotifications" className="ml-2 block text-sm text-gray-900 dark:text-white">
              Send email notifications to affected users
            </label>
          </div>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <div className="flex">
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-medium">Important Notes:</p>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li>Always validate your data before executing the migration</li>
                <li>Large imports may take several minutes to complete</li>
                <li>Existing records will be updated if overwrite is enabled</li>
                <li>Invalid records will be skipped and reported in the results</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataInput;