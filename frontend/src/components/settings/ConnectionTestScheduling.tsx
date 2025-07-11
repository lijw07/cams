import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { Application, ConnectionTestSchedule } from '../../types';
import { useConnectionScheduling } from '../../hooks/useConnectionScheduling';
import Card, { CardHeader, CardTitle, CardContent } from '../common/Card';
import { LoadingSpinner } from '../common';
import ScheduleListItem from './ScheduleListItem';
import ScheduleEditModal from './ScheduleEditModal';

const ConnectionTestScheduling: React.FC = () => {
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  
  const {
    applications,
    schedules,
    isLoading,
    runningTests,
    saveSchedule,
    toggleSchedule,
    deleteSchedule,
    runTest
  } = useConnectionScheduling();

  const handleEdit = (application: Application) => {
    setEditingApp(application);
  };

  const handleCloseModal = () => {
    setEditingApp(null);
  };

  const handleDeleteSchedule = async (schedule: ConnectionTestSchedule) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      await deleteSchedule(schedule);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Connection Test Scheduling
          </CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No active applications with database connections found.
            </div>
          ) : (
            <div className="space-y-1">
              {applications.map(app => {
                const schedule = schedules.get(app.Id);
                const isRunning = runningTests.has(app.Id);
                
                return (
                  <ScheduleListItem
                    key={app.Id}
                    application={app}
                    schedule={schedule}
                    isRunning={isRunning}
                    isEditing={editingApp?.Id === app.Id}
                    onToggle={() => schedule && toggleSchedule(schedule)}
                    onEdit={() => handleEdit(app)}
                    onDelete={() => schedule && handleDeleteSchedule(schedule)}
                    onRunNow={() => schedule && runTest(schedule)}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ScheduleEditModal
        isOpen={!!editingApp}
        onClose={handleCloseModal}
        application={editingApp}
        schedule={editingApp ? schedules.get(editingApp.Id) : undefined}
        onSave={saveSchedule}
      />
    </>
  );
};

export default ConnectionTestScheduling;