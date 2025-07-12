import React from 'react';

import { UseFormRegister, FieldErrors } from 'react-hook-form';

import { Server } from 'lucide-react';

import { ApplicationRequest } from '../../types';

interface ApplicationFormProps {
  register: UseFormRegister<ApplicationRequest>;
  errors: FieldErrors<ApplicationRequest>;
  isSubmitting: boolean;
  mode: 'create' | 'edit';
  onClose?: () => void;
}

export const ApplicationForm: React.FC<ApplicationFormProps> = ({
  register,
  errors,
  isSubmitting,
  mode,
  onClose
}) => {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <Server className="w-5 h-5 mr-2" />
        Application Details
      </h3>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="Name" className="label">
            Application Name *
          </label>
          <input
            {...register('Name', {
              required: 'Application name is required',
              minLength: {
                value: 3,
                message: 'Name must be at least 3 characters'
              }
            })}
            type="text"
            id="Name"
            className="input"
            placeholder="e.g., E-commerce API"
          />
          {errors.Name && (
            <p className="mt-1 text-sm text-error-600">{errors.Name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="Description" className="label">
            Description
          </label>
          <textarea
            {...register('Description')}
            id="Description"
            rows={3}
            className="input"
            placeholder="Brief description of the application"
          />
        </div>

        <div>
          <label htmlFor="Version" className="label">
            Version
          </label>
          <input
            {...register('Version')}
            type="text"
            id="Version"
            className="input"
            placeholder="e.g., 1.0.0"
          />
        </div>

        <div>
          <label htmlFor="Environment" className="label">
            Environment
          </label>
          <select
            {...register('Environment')}
            id="Environment"
            className="input"
          >
            <option value="Development">Development</option>
            <option value="Staging">Staging</option>
            <option value="Production">Production</option>
            <option value="Testing">Testing</option>
          </select>
        </div>

        <div>
          <label htmlFor="Tags" className="label">
            Tags
          </label>
          <input
            {...register('Tags')}
            type="text"
            id="Tags"
            className="input"
            placeholder="e.g., api, microservice, backend (comma-separated)"
          />
          <p className="mt-1 text-sm text-gray-500">
            Separate multiple tags with commas
          </p>
        </div>

        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border">
          <div className="flex items-center">
            <input
              {...register('IsActive')}
              type="checkbox"
              id="IsActive"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="IsActive" className="ml-2 block text-sm font-medium text-gray-900">
              Active Application
            </label>
          </div>
          <span className="text-xs text-gray-500">
            Application will be available for use when active
          </span>
        </div>

        <div className="flex justify-end pt-4 space-x-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Application' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};