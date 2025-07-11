import React from 'react';

import { PlayCircle, Edit2, Trash2, Loader2 } from 'lucide-react';

import { Application, ConnectionTestSchedule } from '../../types';
import { Switch, Button } from '../common';

import ScheduleStatusDisplay from './ScheduleStatusDisplay';

interface ScheduleListItemProps {
  application: Application;
  schedule?: ConnectionTestSchedule;
  isRunning: boolean;
  isEditing: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRunNow: () => void;
}

const ScheduleListItem: React.FC<ScheduleListItemProps> = ({
  application,
  schedule,
  isRunning,
  isEditing,
  onToggle,
  onEdit,
  onDelete,
  onRunNow
}) => {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 last:border-0 py-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900 dark:text-white">
              {application.Name}
            </h4>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({application.DatabaseConnectionCount} connections)
            </span>
          </div>

          {schedule && (
            <div className="mt-2 space-y-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Schedule: <span className="font-mono">{schedule.CronExpression}</span>
                {schedule.CronDescription && (
                  <span className="ml-2">({schedule.CronDescription})</span>
                )}
              </div>
              
              <ScheduleStatusDisplay
                status={schedule.LastRunStatus}
                lastRunTime={schedule.LastRunTime}
                nextRunTime={schedule.NextRunTime}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4">
          {schedule && (
            <>
              <Switch
                checked={schedule.IsEnabled}
                onChange={onToggle}
                label={schedule.IsEnabled ? 'Enabled' : 'Disabled'}
              />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onRunNow}
                disabled={!schedule.IsEnabled || isRunning}
              >
                {isRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PlayCircle className="h-4 w-4" />
                )}
              </Button>
            </>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            disabled={isEditing}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          
          {schedule && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleListItem;