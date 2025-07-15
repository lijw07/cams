import React from 'react';

import { useForm } from 'react-hook-form';

import { Shield, Users, Lock } from 'lucide-react';

import { Modal, Button, Input, Select, Textarea, FormField } from '../common';
import { CreateGitHubTeamRequest } from '../../types/github';
import { githubManagementService } from '../../services/githubManagementService';
import { useNotifications } from '../../contexts/NotificationContext';

interface GitHubTeamModalProps {
  isOpen: boolean;
  organization: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const GitHubTeamModal: React.FC<GitHubTeamModalProps> = ({
  isOpen,
  organization,
  onClose,
  onSuccess
}) => {
  const { addNotification } = useNotifications();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateGitHubTeamRequest>({
    defaultValues: {
      Organization: organization,
      Privacy: 'closed'
    }
  });

  const onSubmit = async (data: CreateGitHubTeamRequest) => {
    try {
      await githubManagementService.createTeam({
        ...data,
        Organization: organization
      });
      
      addNotification({
        title: 'Team created successfully',
        message: `Team "${data.TeamName}" has been created`,
        type: 'success',
        source: 'GitHub Management',
        suggestions: [
          'You can now add members to this team',
          'Grant repository access to the entire team',
          'Team members will inherit permissions from the team'
        ]
      });
      
      onSuccess();
    } catch (error) {
      addNotification({
        title: 'Failed to create team',
        message: 'Could not create GitHub team',
        type: 'error',
        source: 'GitHub Management'
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create GitHub Team"
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          label="Team Name"
          icon={<Users className="w-4 h-4" />}
          error={errors.TeamName?.message}
          required
        >
          <Input
            {...register('TeamName', {
              required: 'Team name is required',
              minLength: {
                value: 3,
                message: 'Team name must be at least 3 characters'
              },
              pattern: {
                value: /^[a-zA-Z0-9-_]+$/,
                message: 'Team name can only contain letters, numbers, hyphens, and underscores'
              }
            })}
            placeholder="engineering-team"
          />
        </FormField>

        <FormField
          label="Description"
          error={errors.Description?.message}
        >
          <Textarea
            {...register('Description')}
            rows={3}
            placeholder="Team responsible for backend development..."
          />
        </FormField>

        <FormField
          label="Privacy"
          icon={<Lock className="w-4 h-4" />}
          error={errors.Privacy?.message}
          helperText="Secret teams are only visible to organization owners and team members"
        >
          <Select
            {...register('Privacy')}
          >
            <option value="closed">Closed - Visible to all organization members</option>
            <option value="secret">Secret - Only visible to team members</option>
          </Select>
        </FormField>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Team Permissions
          </h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
            <li>Teams provide a way to manage repository access for groups of users</li>
            <li>Team members inherit all permissions granted to the team</li>
            <li>You can add repositories and members after creating the team</li>
            <li>Teams can have different permission levels for each repository</li>
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
            Create Team
          </Button>
        </div>
      </form>
    </Modal>
  );
};