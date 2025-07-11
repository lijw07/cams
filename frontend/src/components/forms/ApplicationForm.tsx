import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Server } from 'lucide-react';
import { ApplicationWithConnectionRequest } from '@/types';
import { FormField, Input, Textarea, Select, Checkbox } from '../common';

interface ApplicationFormProps {
  register: UseFormRegister<ApplicationWithConnectionRequest>;
  errors: FieldErrors<ApplicationWithConnectionRequest>;
}

const ApplicationForm: React.FC<ApplicationFormProps> = ({ register, errors }) => {
  const environmentOptions = [
    { value: 'Development', label: 'Development' },
    { value: 'Staging', label: 'Staging' },
    { value: 'Production', label: 'Production' },
    { value: 'Testing', label: 'Testing' }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-secondary-900 dark:text-white flex items-center">
        <Server className="w-5 h-5 mr-2" />
        Application Details
      </h3>

      <FormField 
        label="Application Name" 
        required 
        error={errors.applicationName?.message}
      >
        <Input
          {...register('applicationName', {
            required: 'Application name is required',
            minLength: {
              value: 3,
              message: 'Name must be at least 3 characters'
            }
          })}
          placeholder="e.g., E-commerce API"
          error={!!errors.applicationName}
        />
      </FormField>

      <FormField label="Description">
        <Textarea
          {...register('applicationDescription')}
          placeholder="Brief description of the application"
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Version">
          <Input
            {...register('version')}
            placeholder="e.g., 1.0.0"
          />
        </FormField>

        <FormField label="Environment">
          <Select
            {...register('environment')}
            options={environmentOptions}
          />
        </FormField>
      </div>

      <FormField 
        label="Tags" 
        helpText="Separate multiple tags with commas"
      >
        <Input
          {...register('tags')}
          placeholder="e.g., api, microservice, backend (comma-separated)"
        />
      </FormField>

      <div className="p-3 bg-secondary-50 dark:bg-secondary-700 rounded-lg border border-secondary-200 dark:border-secondary-600">
        <Checkbox
          {...register('isApplicationActive')}
          label="Active Application"
        />
        <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">
          Application will be available for use when active
        </p>
      </div>
    </div>
  );
};

export default ApplicationForm;