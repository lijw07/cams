import React from 'react';

import { AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

interface ScheduleStatusDisplayProps {
  status?: string;
  lastRunTime?: string;
  nextRunTime?: string;
}

const ScheduleStatusDisplay: React.FC<ScheduleStatusDisplayProps> = ({
  status,
  lastRunTime,
  nextRunTime
}) => {
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'Success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'Running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-2 text-sm">
      {status && (
        <div className="flex items-center gap-2">
          {getStatusIcon(status)}
          <span className="text-gray-600 dark:text-gray-400">
            Status: <span className="font-medium">{status}</span>
          </span>
        </div>
      )}
      
      {lastRunTime && (
        <div className="text-gray-600 dark:text-gray-400">
          Last run: {formatDateTime(lastRunTime)}
        </div>
      )}
      
      {nextRunTime && (
        <div className="text-gray-600 dark:text-gray-400">
          Next run: {formatDateTime(nextRunTime)}
        </div>
      )}
    </div>
  );
};

export default ScheduleStatusDisplay;