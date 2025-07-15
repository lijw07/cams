import React from 'react';

import { UseFormRegister, FieldErrors } from 'react-hook-form';

import { Server, ToggleLeft, ToggleRight } from 'lucide-react';

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
          Application Name
        </label>
        <input
          {...register('ApplicationName')}
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

      <div className="p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-600">
        <div className="flex items-center justify-between">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              {...register('IsApplicationActive')}
              type="checkbox"
              className="sr-only peer"
              id="isApplicationActive"
            />
            <div className="w-11 h-6 bg-gray-400 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            <span className="ml-3 text-sm font-medium text-secondary-900 dark:text-secondary-300">
              Active
            </span>
          </label>
          <div>
            <h4 className="text-sm font-medium text-secondary-900 dark:text-white">Application Status</h4>
            <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">
              Active applications can be accessed and used by the system
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailsStep;