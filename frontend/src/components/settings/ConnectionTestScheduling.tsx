import React, { useState, useEffect, useCallback } from 'react';
import { Clock, PlayCircle, AlertCircle, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { Application, ConnectionTestSchedule, ConnectionTestScheduleRequest } from '../../types';
import { applicationService } from '../../services/applicationService';
import { connectionTestScheduleService } from '../../services/connectionTestScheduleService';
import { useNotifications } from '../../contexts/NotificationContext';
import Card, { CardHeader, CardTitle, CardContent } from '../common/Card';
import { Switch, Tooltip } from '../common';

const ConnectionTestScheduling: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [schedules, setSchedules] = useState<Map<string, ConnectionTestSchedule>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [cronExpression, setCronExpression] = useState('');
  const [cronValidation, setCronValidation] = useState<{ isValid: boolean; description?: string; nextRunTime?: string } | null>(null);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());
  const { addNotification } = useNotifications();

  const cronPresets = connectionTestScheduleService.getCronPresets();

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [appsData, schedulesData] = await Promise.all([
        applicationService.getApplications(),
        connectionTestScheduleService.getSchedules()
      ]);

      setApplications(appsData.filter(app => app.IsActive && app.DatabaseConnectionCount > 0));
      
      const schedulesMap = new Map<string, ConnectionTestSchedule>();
      schedulesData.forEach(schedule => {
        schedulesMap.set(schedule.ApplicationId, schedule);
      });
      setSchedules(schedulesMap);
    } catch (error) {
      addNotification({
        title: 'Load Failed',
        message: 'Failed to load connection test schedules',
        type: 'error',
        source: 'Settings'
      });
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    if (preset) {
      setCronExpression(preset);
      validateCron(preset);
    }
  };

  const validateCron = async (expression: string) => {
    if (!expression.trim()) {
      setCronValidation(null);
      return;
    }

    try {
      const result = await connectionTestScheduleService.validateCronExpression(expression);
      setCronValidation(result);
    } catch (error) {
      setCronValidation({ isValid: false, description: 'Invalid cron expression' });
    }
  };

  const handleSaveSchedule = async (applicationId: string) => {
    if (!cronExpression.trim() || !cronValidation?.isValid) {
      addNotification({
        title: 'Invalid Expression',
        message: 'Please enter a valid cron expression',
        type: 'error',
        source: 'Settings'
      });
      return;
    }

    try {
      const data: ConnectionTestScheduleRequest = {
        ApplicationId: applicationId,
        CronExpression: cronExpression,
        IsEnabled: true
      };

      const result = await connectionTestScheduleService.upsertSchedule(data);
      
      setSchedules(prev => new Map(prev).set(applicationId, result));
      setEditingAppId(null);
      setCronExpression('');
      setCronValidation(null);
      setSelectedPreset('');

      addNotification({
        title: 'Schedule Saved',
        message: `Connection test schedule saved for ${applications.find(app => app.Id === applicationId)?.Name}`,
        type: 'success',
        source: 'Settings'
      });
    } catch (error) {
      addNotification({
        title: 'Save Failed',
        message: 'Failed to save connection test schedule',
        type: 'error',
        source: 'Settings'
      });
    }
  };

  const handleToggleSchedule = async (schedule: ConnectionTestSchedule) => {
    try {
      const updated = await connectionTestScheduleService.toggleSchedule(schedule.Id!, !schedule.IsEnabled);
      setSchedules(prev => new Map(prev).set(schedule.ApplicationId, updated));

      addNotification({
        title: 'Schedule Updated',
        message: `Schedule ${updated.IsEnabled ? 'enabled' : 'disabled'} for ${schedule.ApplicationName}`,
        type: 'success',
        source: 'Settings'
      });
    } catch (error) {
      addNotification({
        title: 'Update Failed',
        message: 'Failed to update schedule',
        type: 'error',
        source: 'Settings'
      });
    }
  };

  const handleDeleteSchedule = async (schedule: ConnectionTestSchedule) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      await connectionTestScheduleService.deleteSchedule(schedule.Id!);
      setSchedules(prev => {
        const newMap = new Map(prev);
        newMap.delete(schedule.ApplicationId);
        return newMap;
      });

      addNotification({
        title: 'Schedule Deleted',
        message: `Schedule deleted for ${schedule.ApplicationName}`,
        type: 'success',
        source: 'Settings'
      });
    } catch (error) {
      addNotification({
        title: 'Delete Failed',
        message: 'Failed to delete schedule',
        type: 'error',
        source: 'Settings'
      });
    }
  };

  const handleRunNow = async (schedule: ConnectionTestSchedule) => {
    try {
      setRunningTests(prev => new Set(prev).add(schedule.Id!));
      
      const result = await connectionTestScheduleService.runScheduleNow(schedule.Id!);
      
      // Refresh the schedule to get updated status
      await loadData();
      
      const statusColor = result.Status === 'success' ? 'success' : 
                         result.Status === 'failed' ? 'error' : 'warning';
      
      addNotification({
        title: 'Test Completed',
        message: `${result.Message} (${result.Duration})`,
        type: statusColor,
        source: 'Settings'
      });
    } catch (error: any) {
      addNotification({
        title: 'Test Failed',
        message: error.response?.data?.message || 'Failed to run connection test',
        type: 'error',
        source: 'Settings'
      });
    } finally {
      setRunningTests(prev => {
        const newSet = new Set(prev);
        newSet.delete(schedule.Id!);
        return newSet;
      });
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <PlayCircle className="w-4 h-4 text-blue-500 animate-pulse" />;
      default:
        return <AlertCircle className="w-4 h-4 text-secondary-400" />;
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Clock className="w-5 h-5 inline mr-2" />
          Connection Test Scheduling
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            Schedule automatic connection tests for your applications using cron expressions.
          </p>

          {applications.length === 0 ? (
            <div className="text-center py-8 text-secondary-500 dark:text-secondary-400">
              No active applications with database connections found.
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map(app => {
                const schedule = schedules.get(app.Id);
                const isEditing = editingAppId === app.Id;

                return (
                  <div key={app.Id} className="border border-secondary-200 dark:border-secondary-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-secondary-900 dark:text-white">{app.Name}</h4>
                        <p className="text-sm text-secondary-600 dark:text-secondary-400">
                          {app.DatabaseConnectionCount} connection{app.DatabaseConnectionCount > 1 ? 's' : ''}
                        </p>
                      </div>
                      {schedule && (
                        <Switch
                          checked={schedule.IsEnabled}
                          onChange={() => handleToggleSchedule(schedule)}
                          label={schedule.IsEnabled ? 'Enabled' : 'Disabled'}
                        />
                      )}
                    </div>

                    {schedule && !isEditing ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-secondary-600 dark:text-secondary-400">Schedule:</span>
                          <code className="bg-secondary-100 dark:bg-secondary-700 px-2 py-1 rounded">
                            {schedule.CronExpression}
                          </code>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-secondary-600 dark:text-secondary-400">Next Run:</span>
                          <span>{formatDateTime(schedule.NextRunTime)}</span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-secondary-600 dark:text-secondary-400">Last Run:</span>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(schedule.LastRunStatus)}
                            <span>{formatDateTime(schedule.LastRunTime)}</span>
                          </div>
                        </div>

                        <div className="flex justify-end space-x-2 mt-3">
                          <button
                            onClick={() => handleRunNow(schedule)}
                            disabled={runningTests.has(schedule.Id!) || !schedule.IsEnabled}
                            className="btn btn-sm btn-primary"
                            title={!schedule.IsEnabled ? 'Enable schedule to run tests' : 'Run connection test now'}
                          >
                            {runningTests.has(schedule.Id!) ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                                Running...
                              </>
                            ) : (
                              <>
                                <PlayCircle className="w-4 h-4 mr-1" />
                                Run Now
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setEditingAppId(app.Id);
                              setCronExpression(schedule.CronExpression);
                              validateCron(schedule.CronExpression);
                            }}
                            className="btn btn-sm btn-secondary"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSchedule(schedule)}
                            className="btn btn-sm btn-outline text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ) : isEditing || !schedule ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                            Cron Expression
                            <Tooltip content="Use standard cron syntax (minute hour day month weekday)">
                              <HelpCircle className="w-4 h-4 inline ml-1 text-secondary-400" />
                            </Tooltip>
                          </label>
                          
                          <div className="space-y-2">
                            <select
                              value={selectedPreset}
                              onChange={(e) => handlePresetChange(e.target.value)}
                              className="input w-full"
                            >
                              <option value="">Custom expression...</option>
                              {cronPresets.map(preset => (
                                <option key={preset.value} value={preset.value}>
                                  {preset.label} - {preset.description}
                                </option>
                              ))}
                            </select>

                            <input
                              type="text"
                              value={cronExpression}
                              onChange={(e) => {
                                setCronExpression(e.target.value);
                                setSelectedPreset('');
                                validateCron(e.target.value);
                              }}
                              placeholder="e.g., */5 * * * * (every 5 minutes)"
                              className="input w-full"
                            />
                          </div>

                          {cronValidation && (
                            <div className={`mt-2 text-sm ${cronValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                              {cronValidation.isValid ? (
                                <>
                                  <CheckCircle className="w-4 h-4 inline mr-1" />
                                  Valid - {cronValidation.description}
                                  {cronValidation.nextRunTime && (
                                    <div className="text-secondary-600 dark:text-secondary-400 mt-1">
                                      Next run: {formatDateTime(cronValidation.nextRunTime)}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 inline mr-1" />
                                  {cronValidation.description}
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              setEditingAppId(null);
                              setCronExpression('');
                              setCronValidation(null);
                              setSelectedPreset('');
                            }}
                            className="btn btn-sm btn-secondary"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveSchedule(app.Id)}
                            disabled={!cronExpression.trim() || !cronValidation?.isValid}
                            className="btn btn-sm btn-primary"
                          >
                            Save Schedule
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-400 mb-2">
              About Cron Expressions
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Cron expressions consist of 5 fields: minute (0-59), hour (0-23), day of month (1-31), month (1-12), and day of week (0-7).
              Use * for any value, */n for intervals, and comma-separated values for multiple specific times.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectionTestScheduling;