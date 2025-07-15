import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../common/Modal';
import { ExternalConnection, ExternalConnectionRequest, ExternalConnectionType } from '../../types/externalConnection';
import { useNotifications } from '../../contexts/NotificationContext';
import { externalConnectionService } from '../../services/externalConnectionService';

interface ExternalConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId?: string;
  applicationName?: string;
  connection?: ExternalConnection;
  mode: 'create' | 'edit';
  onSuccess?: () => void;
}

const ExternalConnectionModal: React.FC<ExternalConnectionModalProps> = ({
  isOpen,
  onClose,
  applicationId,
  applicationName,
  connection,
  mode,
  onSuccess
}) => {
  const { addNotification } = useNotifications();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm<ExternalConnectionRequest>({
    defaultValues: {
      ApplicationId: applicationId || connection?.ApplicationId || '',
      Name: connection?.Name || '',
      Description: connection?.Description || '',
      Type: connection?.Type || ExternalConnectionType.GitHub,
      Url: connection?.Url || '',
      Repository: connection?.Repository || '',
      Branch: connection?.Branch || 'main',
      ApiKey: '',
      WebhookUrl: connection?.WebhookUrl || '',
      IsActive: connection?.IsActive ?? true
    }
  });

  const selectedType = watch('Type');

  useEffect(() => {
    if (isOpen && connection && mode === 'edit') {
      reset({
        ApplicationId: connection.ApplicationId,
        Name: connection.Name,
        Description: connection.Description || '',
        Type: connection.Type,
        Url: connection.Url || '',
        Repository: connection.Repository || '',
        Branch: connection.Branch || 'main',
        ApiKey: '',
        WebhookUrl: connection.WebhookUrl || '',
        IsActive: connection.IsActive
      });
    }
  }, [isOpen, connection, mode, reset]);

  const onSubmit = async (data: ExternalConnectionRequest) => {
    try {
      setIsSubmitting(true);

      if (mode === 'create') {
        await externalConnectionService.createConnection(data);
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'External connection created successfully'
        });
      } else if (connection) {
        await externalConnectionService.updateConnection(connection.Id, {
          ...data,
          Id: connection.Id
        });
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'External connection updated successfully'
        });
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: `Failed to ${mode} external connection`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTest = async () => {
    if (!connection?.Id) {
      addNotification({
        type: 'warning',
        title: 'Warning',
        message: 'Save the connection first before testing'
      });
      return;
    }

    try {
      setIsTesting(true);
      const result = await externalConnectionService.testConnection(connection.Id);
      
      if (result.Success) {
        addNotification({
          type: 'success',
          title: 'Test Successful',
          message: result.Message || 'Connection test passed'
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Test Failed',
          message: result.Message || 'Connection test failed'
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to test connection'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const renderTypeSpecificFields = () => {
    switch (selectedType) {
      case ExternalConnectionType.GitHub:
      case ExternalConnectionType.GitLab:
      case ExternalConnectionType.Bitbucket:
      case ExternalConnectionType.AzureDevOps:
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Repository <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('Repository', { required: 'Repository is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="organization/repository"
              />
              {errors.Repository && (
                <p className="mt-1 text-sm text-red-600">{errors.Repository.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Branch
              </label>
              <input
                type="text"
                {...register('Branch')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="main"
              />
            </div>
          </>
        );

      case ExternalConnectionType.Jenkins:
      case ExternalConnectionType.CircleCI:
      case ExternalConnectionType.TravisCI:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Build URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              {...register('Url', { required: 'Build URL is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="https://jenkins.example.com/job/my-job"
            />
            {errors.Url && (
              <p className="mt-1 text-sm text-red-600">{errors.Url.message}</p>
            )}
          </div>
        );

      case ExternalConnectionType.Webhook:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Webhook URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              {...register('WebhookUrl', { required: 'Webhook URL is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="https://example.com/webhook"
            />
            {errors.WebhookUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.WebhookUrl.message}</p>
            )}
          </div>
        );

      default:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Connection URL
            </label>
            <input
              type="url"
              {...register('Url')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="https://api.example.com"
            />
          </div>
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Create External Connection' : 'Edit External Connection'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {applicationName && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-700">
              Application: <span className="font-medium">{applicationName}</span>
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Connection Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('Name', { required: 'Name is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            placeholder="My GitHub Repository"
          />
          {errors.Name && (
            <p className="mt-1 text-sm text-red-600">{errors.Name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Connection Type <span className="text-red-500">*</span>
          </label>
          <select
            {...register('Type', { required: 'Type is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <optgroup label="Source Control">
              <option value={ExternalConnectionType.GitHub}>GitHub</option>
              <option value={ExternalConnectionType.GitLab}>GitLab</option>
              <option value={ExternalConnectionType.Bitbucket}>Bitbucket</option>
              <option value={ExternalConnectionType.AzureDevOps}>Azure DevOps</option>
            </optgroup>
            <optgroup label="CI/CD">
              <option value={ExternalConnectionType.Jenkins}>Jenkins</option>
              <option value={ExternalConnectionType.CircleCI}>CircleCI</option>
              <option value={ExternalConnectionType.TravisCI}>Travis CI</option>
            </optgroup>
            <optgroup label="Communication">
              <option value={ExternalConnectionType.Slack}>Slack</option>
              <option value={ExternalConnectionType.Teams}>Microsoft Teams</option>
            </optgroup>
            <optgroup label="Other">
              <option value={ExternalConnectionType.Jira}>Jira</option>
              <option value={ExternalConnectionType.Webhook}>Webhook</option>
              <option value={ExternalConnectionType.Custom}>Custom</option>
            </optgroup>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            {...register('Description')}
            rows={2}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            placeholder="Optional description..."
          />
        </div>

        {renderTypeSpecificFields()}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            API Key / Token
          </label>
          <input
            type="password"
            {...register('ApiKey')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            placeholder={mode === 'edit' && connection?.HasApiKey ? '••••••••' : 'Enter API key or token'}
          />
          <p className="mt-1 text-xs text-gray-500">
            {mode === 'edit' && connection?.HasApiKey
              ? 'Leave blank to keep existing key'
              : 'Required for private repositories and authenticated APIs'
            }
          </p>
        </div>

        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              type="checkbox"
              {...register('IsActive')}
              className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label className="font-medium text-gray-700">Active</label>
            <p className="text-gray-500">Enable or disable this connection</p>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <div>
            {mode === 'edit' && (
              <button
                type="button"
                onClick={handleTest}
                disabled={isTesting}
                className="btn btn-secondary"
              >
                {isTesting ? 'Testing...' : 'Test Connection'}
              </button>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default ExternalConnectionModal;