import React, { useState, useEffect } from 'react';

import { Application, ConnectionTestSchedule, ConnectionTestScheduleRequest } from '../../types';
import { Modal, Button } from '../common';

import CronExpressionEditor from './CronExpressionEditor';

interface ScheduleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  schedule?: ConnectionTestSchedule;
  onSave: (applicationId: string, request: ConnectionTestScheduleRequest) => Promise<boolean>;
}

const ScheduleEditModal: React.FC<ScheduleEditModalProps> = ({
  isOpen,
  onClose,
  application,
  schedule,
  onSave
}) => {
  const [cronExpression, setCronExpression] = useState('');
  const [cronValidation, setCronValidation] = useState<{ isValid: boolean; description?: string; nextRunTime?: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (schedule) {
      setCronExpression(schedule.CronExpression);
    } else {
      setCronExpression('0 0 * * *'); // Default to daily at midnight
    }
  }, [schedule]);

  const handleSave = async () => {
    if (!application || !cronValidation?.isValid) return;

    setIsSaving(true);
    const request: ConnectionTestScheduleRequest = {
      ApplicationId: application.Id,
      CronExpression: cronExpression,
      IsEnabled: schedule?.IsEnabled ?? true
    };

    const success = await onSave(application.Id, request);
    setIsSaving(false);

    if (success) {
      onClose();
    }
  };

  if (!application) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Schedule Tests - ${application.Name}`}>
      <div className="space-y-6">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Configure automated connection tests for all database connections in this application.
        </div>

        <CronExpressionEditor
          value={cronExpression}
          onChange={setCronExpression}
          onValidationChange={setCronValidation}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!cronValidation?.isValid || isSaving}
            loading={isSaving}
          >
            Save Schedule
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ScheduleEditModal;