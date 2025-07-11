import React from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { MigrationValidationResult, MigrationResult, MigrationProgress } from '../../types';
import ProgressTracker from '../ui/ProgressTracker';
import Card from '../common/Card';

interface MigrationResultsProps {
  validationResult: MigrationValidationResult | null;
  migrationResult: MigrationResult | null;
  currentProgress: MigrationProgress | null;
  showProgress: boolean;
}

const MigrationResults: React.FC<MigrationResultsProps> = ({
  validationResult,
  migrationResult,
  currentProgress,
  showProgress
}) => {
  return (
    <div className="space-y-6">
      {/* Validation Results */}
      {validationResult && (
        <Card>
          <div className="flex items-center mb-4">
            {validationResult.IsValid ? (
              <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600 mr-2" />
            )}
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Validation Results
            </h3>
          </div>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Total Records:</span>
                <span className="ml-2 font-medium">{validationResult.TotalRecords}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Valid:</span>
                <span className="ml-2 font-medium text-green-600">{validationResult.TotalRecords - (validationResult.Errors?.length || 0)}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Invalid:</span>
                <span className="ml-2 font-medium text-red-600">{validationResult.Errors?.length || 0}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Warnings:</span>
                <span className="ml-2 font-medium text-yellow-600">{validationResult.Warnings?.length || 0}</span>
              </div>
            </div>

            {validationResult.Errors && validationResult.Errors.length > 0 && (
              <div>
                <h4 className="font-medium text-red-600 mb-2">Validation Errors:</h4>
                <ul className="space-y-1 text-sm">
                  {validationResult.Errors.slice(0, 10).map((error: any, index: any) => (
                    <li key={index} className="text-red-600 dark:text-red-400">
                      • {error}
                    </li>
                  ))}
                  {validationResult.Errors.length > 10 && (
                    <li className="text-gray-500 dark:text-gray-400">
                      ... and {validationResult.Errors.length - 10} more errors
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Migration Progress */}
      {showProgress && currentProgress && (
        <Card>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Migration Progress
          </h3>
          <ProgressTracker
            progress={currentProgress}
            isVisible={true}
          />
        </Card>
      )}

      {/* Migration Results */}
      {migrationResult && (
        <Card>
          <div className="flex items-center mb-4">
            {migrationResult.Success ? (
              <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
            ) : (
              <AlertCircle className="w-6 h-6 text-yellow-600 mr-2" />
            )}
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Migration Results
            </h3>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Processed:</span>
                <span className="ml-2 font-medium">{migrationResult.TotalRecords}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Success:</span>
                <span className="ml-2 font-medium text-green-600">{migrationResult.SuccessfulRecords}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Failed:</span>
                <span className="ml-2 font-medium text-red-600">{migrationResult.FailedRecords}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                <span className="ml-2 font-medium">{migrationResult.Duration}</span>
              </div>
            </div>

            {migrationResult.Errors && migrationResult.Errors.length > 0 && (
              <div>
                <h4 className="font-medium text-red-600 mb-2">Errors:</h4>
                <ul className="space-y-1 text-sm">
                  {migrationResult.Errors.slice(0, 10).map((error: any, index: any) => (
                    <li key={index} className="text-red-600 dark:text-red-400">
                      • {error}
                    </li>
                  ))}
                  {migrationResult.Errors.length > 10 && (
                    <li className="text-gray-500 dark:text-gray-400">
                      ... and {migrationResult.Errors.length - 10} more errors
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default MigrationResults;