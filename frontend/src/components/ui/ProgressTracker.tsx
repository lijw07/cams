import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';
import { MigrationProgress } from '../../types';

interface ProgressTrackerProps {
  progress: MigrationProgress | null;
  isVisible: boolean;
  className?: string;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ 
  progress, 
  isVisible, 
  className = '' 
}) => {
  if (!isVisible || !progress) {
    return null;
  }

  const getStatusIcon = () => {
    if (progress.isCompleted) {
      return progress.isSuccessful ? (
        <CheckCircle className="w-5 h-5 text-green-500" />
      ) : (
        <XCircle className="w-5 h-5 text-red-500" />
      );
    }
    return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
  };

  const getStatusColor = () => {
    if (progress.isCompleted) {
      return progress.isSuccessful ? 'bg-green-500' : 'bg-red-500';
    }
    return 'bg-blue-500';
  };

  const formatTime = (timeString: string) => {
    try {
      return new Date(timeString).toLocaleTimeString();
    } catch {
      return timeString;
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <h3 className="text-lg font-semibold text-gray-900">
            Migration Progress
          </h3>
        </div>
        <div className="text-sm text-gray-500">
          {formatTime(progress.lastUpdated)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{Math.round(progress.percentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-300 ${getStatusColor()}`}
            style={{ width: `${Math.min(100, Math.max(0, progress.percentage))}%` }}
          />
        </div>
      </div>

      {/* Current Operation */}
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-1">
          Current Operation
        </div>
        <div className="text-sm text-gray-600 bg-gray-50 rounded-md p-2">
          {progress.currentOperation || 'Processing...'}
        </div>
      </div>

      {/* Record Progress */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 rounded-md p-3">
          <div className="text-sm font-medium text-blue-700">Processed</div>
          <div className="text-lg font-bold text-blue-900">
            {progress.processedRecords.toLocaleString()}
          </div>
        </div>
        <div className="bg-gray-50 rounded-md p-3">
          <div className="text-sm font-medium text-gray-700">Total</div>
          <div className="text-lg font-bold text-gray-900">
            {progress.totalRecords.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Estimated Time Remaining */}
      {progress.estimatedTimeRemaining && !progress.isCompleted && (
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-1">
            Estimated Time Remaining
          </div>
          <div className="text-sm text-gray-600">
            {progress.estimatedTimeRemaining}
          </div>
        </div>
      )}

      {/* Recent Errors */}
      {progress.recentErrors && progress.recentErrors.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <div className="text-sm font-medium text-red-700">
              Recent Errors
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <ul className="text-sm text-red-700 space-y-1">
              {progress.recentErrors.slice(0, 3).map((error, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  <span className="flex-1">{error}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Recent Warnings */}
      {progress.recentWarnings && progress.recentWarnings.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-4 h-4 text-yellow-500" />
            <div className="text-sm font-medium text-yellow-700">
              Recent Warnings
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <ul className="text-sm text-yellow-700 space-y-1">
              {progress.recentWarnings.slice(0, 3).map((warning, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  <span className="flex-1">{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Final Status */}
      {progress.isCompleted && (
        <div className={`p-4 rounded-md ${
          progress.isSuccessful 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className={`text-sm font-medium ${
            progress.isSuccessful ? 'text-green-800' : 'text-red-800'
          }`}>
            {progress.isSuccessful 
              ? 'Migration completed successfully!' 
              : 'Migration completed with errors'
            }
          </div>
          <div className={`text-xs mt-1 ${
            progress.isSuccessful ? 'text-green-600' : 'text-red-600'
          }`}>
            Processed {progress.processedRecords} of {progress.totalRecords} records
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;