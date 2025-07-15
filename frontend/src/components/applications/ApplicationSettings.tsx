import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Application } from '../../types/application';
import { applicationService, ApplicationUpdateRequest } from '../../services/applicationService';
import { useNotifications } from '../../contexts/NotificationContext';

interface ApplicationSettingsProps {
  application: Application;
  onUpdate: (application: Application) => void;
}

const ApplicationSettings: React.FC<ApplicationSettingsProps> = ({ application, onUpdate }) => {
  const { addNotification } = useNotifications();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<ApplicationUpdateRequest>({
    defaultValues: {
      Id: application.Id,
      Name: application.Name,
      Description: application.Description || '',
      Version: application.Version || '',
      Environment: application.Environment || '',
      Tags: application.Tags || '',
      IsActive: application.IsActive
    }
  });

  const onSubmit = async (data: ApplicationUpdateRequest) => {
    try {
      setIsSubmitting(true);
      const updated = await applicationService.updateApplication(application.Id, data);
      onUpdate(updated);
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Application settings updated successfully'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update application settings'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900">Application Settings</h2>
        <p className="mt-1 text-sm text-gray-500">
          Update your application configuration and metadata
        </p>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="Name" className="block text-sm font-medium text-gray-700">
                Application Name
              </label>
              <input
                type="text"
                {...register('Name', { required: 'Name is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
              {errors.Name && (
                <p className="mt-1 text-sm text-red-600">{errors.Name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="Environment" className="block text-sm font-medium text-gray-700">
                Environment
              </label>
              <select
                {...register('Environment')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="">Select environment</option>
                <option value="Development">Development</option>
                <option value="Staging">Staging</option>
                <option value="Production">Production</option>
                <option value="Testing">Testing</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="Description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                {...register('Description')}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="Describe your application..."
              />
            </div>

            <div>
              <label htmlFor="Version" className="block text-sm font-medium text-gray-700">
                Version
              </label>
              <input
                type="text"
                {...register('Version')}
                placeholder="1.0.0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="Tags" className="block text-sm font-medium text-gray-700">
                Tags
              </label>
              <input
                type="text"
                {...register('Tags')}
                placeholder="web, api, microservice"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">Comma-separated tags</p>
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    {...register('IsActive')}
                    className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="IsActive" className="font-medium text-gray-700">
                    Active
                  </label>
                  <p className="text-gray-500">Enable or disable this application</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationSettings;