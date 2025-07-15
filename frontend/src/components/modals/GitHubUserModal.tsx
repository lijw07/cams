import React from 'react';

import { useForm } from 'react-hook-form';

import { Mail, User, Building, MapPin } from 'lucide-react';

import { Modal, Button, Input, Checkbox, FormField } from '../common';
import { CreateGitHubUserRequest } from '../../types/github';
import { githubManagementService } from '../../services/githubManagementService';
import { useNotifications } from '../../contexts/NotificationContext';

interface GitHubUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const GitHubUserModal: React.FC<GitHubUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { addNotification } = useNotifications();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateGitHubUserRequest>({
    defaultValues: {
      SendWelcomeEmail: true
    }
  });

  const onSubmit = async (data: CreateGitHubUserRequest) => {
    try {
      await githubManagementService.createGitHubUser(data);
      
      addNotification({
        title: 'GitHub invitation sent',
        message: `An invitation has been sent to ${data.Email}`,
        type: 'success',
        source: 'GitHub Management',
        suggestions: [
          'The user will receive an email invitation to join your GitHub organization',
          'They must create a GitHub account if they don\'t have one',
          'Once they accept, they will appear in your organization members list'
        ]
      });
      
      onSuccess();
    } catch (error) {
      addNotification({
        title: 'Failed to send invitation',
        message: 'Could not send GitHub invitation',
        type: 'error',
        source: 'GitHub Management'
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite User to GitHub"
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          label="Email Address"
          icon={<Mail className="w-4 h-4" />}
          error={errors.Email?.message}
          required
        >
          <Input
            {...register('Email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
            type="email"
            placeholder="user@example.com"
          />
        </FormField>

        <FormField
          label="GitHub Username"
          icon={<User className="w-4 h-4" />}
          error={errors.Username?.message}
          required
          helperText="The username they will use on GitHub"
        >
          <Input
            {...register('Username', {
              required: 'Username is required',
              pattern: {
                value: /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/,
                message: 'Invalid GitHub username format'
              }
            })}
            placeholder="johndoe"
          />
        </FormField>

        <FormField
          label="Full Name"
          icon={<User className="w-4 h-4" />}
          error={errors.FullName?.message}
          required
        >
          <Input
            {...register('FullName', {
              required: 'Full name is required'
            })}
            placeholder="John Doe"
          />
        </FormField>

        <FormField
          label="Company"
          icon={<Building className="w-4 h-4" />}
          error={errors.Company?.message}
        >
          <Input
            {...register('Company')}
            placeholder="Acme Inc."
          />
        </FormField>

        <FormField
          label="Location"
          icon={<MapPin className="w-4 h-4" />}
          error={errors.Location?.message}
        >
          <Input
            {...register('Location')}
            placeholder="San Francisco, CA"
          />
        </FormField>

        <div className="flex items-center space-x-2">
          <Checkbox
            {...register('SendWelcomeEmail')}
            id="sendWelcomeEmail"
          />
          <label htmlFor="sendWelcomeEmail" className="text-sm">
            Send welcome email with setup instructions
          </label>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            What happens next?
          </h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
            <li>User receives an email invitation to join your GitHub organization</li>
            <li>If they don't have a GitHub account, they'll be prompted to create one</li>
            <li>Once they accept, you can manage their repository access</li>
            <li>They'll be added to the default team with basic permissions</li>
          </ul>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
          >
            Send Invitation
          </Button>
        </div>
      </form>
    </Modal>
  );
};