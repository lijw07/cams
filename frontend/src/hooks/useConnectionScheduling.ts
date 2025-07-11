import { useState, useCallback, useEffect } from 'react';

import { useNotifications } from '../contexts/NotificationContext';
import { applicationService } from '../services/applicationService';
import { connectionTestScheduleService } from '../services/connectionTestScheduleService';
import { Application, ConnectionTestSchedule, ConnectionTestScheduleRequest } from '../types';

export const useConnectionScheduling = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [schedules, setSchedules] = useState<Map<string, ConnectionTestSchedule>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());
  const { addNotification } = useNotifications();

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

  const saveSchedule = useCallback(async (applicationId: string, request: ConnectionTestScheduleRequest) => {
    try {
      const existingSchedule = schedules.get(applicationId);
      
      if (existingSchedule) {
        const updatedSchedule = await connectionTestScheduleService.updateSchedule(existingSchedule.Id, request);
        setSchedules(prev => new Map(prev).set(applicationId, updatedSchedule));
      } else {
        const newSchedule = await connectionTestScheduleService.createSchedule(request);
        setSchedules(prev => new Map(prev).set(applicationId, newSchedule));
      }
      
      addNotification({
        title: 'Schedule Saved',
        message: 'Connection test schedule has been saved',
        type: 'success',
        source: 'Settings'
      });
      
      return true;
    } catch (error) {
      addNotification({
        title: 'Save Failed',
        message: 'Failed to save connection test schedule',
        type: 'error',
        source: 'Settings'
      });
      return false;
    }
  }, [schedules, addNotification]);

  const toggleSchedule = useCallback(async (schedule: ConnectionTestSchedule) => {
    try {
      const updatedSchedule = await connectionTestScheduleService.updateSchedule(schedule.Id, {
        ...schedule,
        IsEnabled: !schedule.IsEnabled
      });
      
      setSchedules(prev => new Map(prev).set(schedule.ApplicationId, updatedSchedule));
      
      addNotification({
        title: schedule.IsEnabled ? 'Schedule Disabled' : 'Schedule Enabled',
        message: `Connection test schedule ${schedule.IsEnabled ? 'disabled' : 'enabled'}`,
        type: 'success',
        source: 'Settings'
      });
    } catch (error) {
      addNotification({
        title: 'Toggle Failed',
        message: 'Failed to toggle schedule status',
        type: 'error',
        source: 'Settings'
      });
    }
  }, [addNotification]);

  const deleteSchedule = useCallback(async (schedule: ConnectionTestSchedule) => {
    try {
      await connectionTestScheduleService.deleteSchedule(schedule.Id);
      
      setSchedules(prev => {
        const newMap = new Map(prev);
        newMap.delete(schedule.ApplicationId);
        return newMap;
      });
      
      addNotification({
        title: 'Schedule Deleted',
        message: 'Connection test schedule has been deleted',
        type: 'success',
        source: 'Settings'
      });
    } catch (error) {
      addNotification({
        title: 'Delete Failed',
        message: 'Failed to delete connection test schedule',
        type: 'error',
        source: 'Settings'
      });
    }
  }, [addNotification]);

  const runTest = useCallback(async (schedule: ConnectionTestSchedule) => {
    const appId = schedule.ApplicationId;
    setRunningTests(prev => new Set(prev).add(appId));
    
    try {
      const result = await connectionTestScheduleService.runNow(schedule.Id);
      
      addNotification({
        title: 'Test Started',
        message: result.message,
        type: 'success',
        source: 'Settings'
      });
      
      // Reload schedules to get updated status
      await loadData();
    } catch (error) {
      addNotification({
        title: 'Test Failed',
        message: 'Failed to start connection test',
        type: 'error',
        source: 'Settings'
      });
    } finally {
      setRunningTests(prev => {
        const newSet = new Set(prev);
        newSet.delete(appId);
        return newSet;
      });
    }
  }, [addNotification, loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    applications,
    schedules,
    isLoading,
    runningTests,
    saveSchedule,
    toggleSchedule,
    deleteSchedule,
    runTest,
    reloadData: loadData
  };
};