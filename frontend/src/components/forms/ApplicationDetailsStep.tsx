import React from 'react';

import { UseFormRegister, FieldErrors } from 'react-hook-form';

import { Server } from 'lucide-react';

import { ApplicationWithConnectionRequest } from '../../types';

interface ApplicationDetailsStepProps {
  register: UseFormRegister<ApplicationWithConnectionRequest>;
  errors: FieldErrors<ApplicationWithConnectionRequest>;
}

const ApplicationDetailsStep: React.FC<ApplicationDetailsStepProps> = ({
  register,
  errors
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-secondary-900 dark:text-white flex items-center">
        <Server className="w-5 h-5 mr-2" />
        Application Details
      </h3>

      <div>
        <label htmlFor="applicationName" className="label">
          Application Name *
        </label>
        <input
          {...register('ApplicationName', {
            required: 'Application name is required',
            minLength: {
              value: 3,
              message: 'Name must be at least 3 characters'
            }
          })}
          type="text"
          id="applicationName"
          className="input"
          placeholder="e.g., E-commerce API"
        />
        {errors.ApplicationName && (
          <p className="mt-1 text-sm text-error-600">{errors.ApplicationName.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="applicationDescription" className="label">
          Description
        </label>
        <textarea
          {...register('ApplicationDescription')}
          id="applicationDescription"
          rows={3}
          className="input"
          placeholder="Brief description of the application"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="version" className="label">
            Version
          </label>
          <input
            {...register('Version')}
            type="text"
            id="version"
            className="input"
            placeholder="e.g., 1.0.0"
          />
        </div>

        <div>
          <label htmlFor="environment" className="label">
            Environment
          </label>
          <select
            {...register('Environment')}
            id="environment"
            className="input"
          >
            <option value="Development">Development</option>
            <option value="Staging">Staging</option>
            <option value="Production">Production</option>
            <option value="Testing">Testing</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="tags" className="label">
          Tags
        </label>
        <input
          {...register('Tags')}
          type="text"
          id="tags"
          className="input"
          placeholder="e.g., api, microservice, backend (comma-separated)"
        />
        <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
          Separate multiple tags with commas
        </p>
      </div>

      <div className="flex items-center space-x-3 p-3 bg-secondary-50 dark:bg-secondary-700 rounded-lg border border-secondary-200 dark:border-secondary-600">
        <div className="flex items-center">
          <input
            {...register('IsApplicationActive')}
            type="checkbox"
            id="isApplicationActive"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 dark:border-secondary-600 rounded"
          />
          <label htmlFor="isApplicationActive" className="ml-2 block text-sm font-medium text-secondary-900 dark:text-white">
            Active Application
          </label>
        </div>
        <span className="text-xs text-secondary-500 dark:text-secondary-400">
          Application will be available for use when active
        </span>
      </div>
    </div>
  );
};

export default ApplicationDetailsStep;