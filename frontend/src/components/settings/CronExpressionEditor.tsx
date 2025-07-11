import React, { useState, useEffect } from 'react';

import { HelpCircle } from 'lucide-react';

import { connectionTestScheduleService } from '../../services/connectionTestScheduleService';
import { Input, Select, Tooltip } from '../common';

interface CronExpressionEditorProps {
  value: string;
  onChange: (expression: string) => void;
  onValidationChange?: (validation: { isValid: boolean; description?: string; nextRunTime?: string } | null) => void;
}

const CronExpressionEditor: React.FC<CronExpressionEditorProps> = ({
  value,
  onChange,
  onValidationChange
}) => {
  const [selectedPreset, setSelectedPreset] = useState('');
  const [validation, setValidation] = useState<{ isValid: boolean; description?: string; nextRunTime?: string } | null>(null);
  
  const cronPresets = connectionTestScheduleService.getCronPresets();

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    if (preset) {
      const presetOption = cronPresets.find(p => p.value === preset);
      if (presetOption) {
        onChange(presetOption.value);
      }
    }
  };

  const validateCron = async (expression: string) => {
    if (!expression) {
      setValidation(null);
      onValidationChange?.(null);
      return;
    }

    try {
      const result = await connectionTestScheduleService.validateCronExpression(expression);
      setValidation(result);
      onValidationChange?.(result);
    } catch (error) {
      const errorValidation = { isValid: false, description: 'Invalid cron expression' };
      setValidation(errorValidation);
      onValidationChange?.(errorValidation);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      validateCron(value);
    }, 500);

    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Preset Schedules
        </label>
        <Select
          value={selectedPreset}
          onChange={(e) => handlePresetChange(e.target.value)}
          options={[
            { value: '', label: 'Select a preset...' },
            ...cronPresets
          ]}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Cron Expression
          </label>
          <Tooltip content="Use cron syntax: minute hour day month weekday">
            <HelpCircle className="h-4 w-4 text-gray-400" />
          </Tooltip>
        </div>
        <Input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setSelectedPreset(''); // Clear preset when manually editing
          }}
          placeholder="0 0 * * * (daily at midnight)"
          className={validation && !validation.isValid ? 'border-red-500' : ''}
        />
        {validation && (
          <div className={`mt-1 text-sm ${validation.isValid ? 'text-green-600' : 'text-red-600'}`}>
            {validation.description}
            {validation.nextRunTime && (
              <span className="block text-gray-500 dark:text-gray-400">
                Next run: {validation.nextRunTime}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CronExpressionEditor;