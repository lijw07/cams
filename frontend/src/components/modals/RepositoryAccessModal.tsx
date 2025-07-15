import React, { useState } from 'react';

import { Shield, Users, FolderOpen } from 'lucide-react';

import { Modal, Button, Select, Checkbox, FormField } from '../common';
import { GitHubUser, GitHubRepository, BulkRepositoryAccessRequest } from '../../types/github';
import { githubManagementService } from '../../services/githubManagementService';
import { useNotifications } from '../../contexts/NotificationContext';

interface RepositoryAccessModalProps {
  isOpen: boolean;
  organization: string;
  repositories: GitHubRepository[];
  users: GitHubUser[];
  onClose: () => void;
  onSuccess: () => void;
}

export const RepositoryAccessModal: React.FC<RepositoryAccessModalProps> = ({
  isOpen,
  organization,
  repositories,
  users,
  onClose,
  onSuccess
}) => {
  const { addNotification } = useNotifications();
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [permission, setPermission] = useState<'read' | 'write' | 'admin'>('read');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedRepos.length === 0 || selectedUsers.length === 0) {
      addNotification({
        title: 'Invalid selection',
        message: 'Please select at least one repository and one user',
        type: 'warning',
        source: 'GitHub Management'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const request: BulkRepositoryAccessRequest = {
        Organization: organization,
        Repositories: selectedRepos,
        Usernames: selectedUsers,
        Permission: permission
      };
      
      const result = await githubManagementService.bulkGrantRepositoryAccess(request);
      
      const successful = result.Results.filter(r => r.Success).length;
      const failed = result.Results.filter(r => !r.Success).length;
      
      addNotification({
        title: 'Repository access updated',
        message: `Successfully updated access for ${successful} items${failed > 0 ? `, ${failed} failed` : ''}`,
        type: successful > 0 ? 'success' : 'error',
        source: 'GitHub Management',
        details: failed > 0 ? `Failed items: ${result.Results.filter(r => !r.Success).map(r => `${r.Username}/${r.Repository}`).join(', ')}` : undefined
      });
      
      if (successful > 0) {
        onSuccess();
      }
    } catch (error) {
      addNotification({
        title: 'Failed to update access',
        message: 'Could not update repository access',
        type: 'error',
        source: 'GitHub Management'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRepo = (repoName: string) => {
    setSelectedRepos(prev =>
      prev.includes(repoName)
        ? prev.filter(r => r !== repoName)
        : [...prev, repoName]
    );
  };

  const toggleUser = (username: string) => {
    setSelectedUsers(prev =>
      prev.includes(username)
        ? prev.filter(u => u !== username)
        : [...prev, username]
    );
  };

  const selectAllRepos = () => {
    setSelectedRepos(repositories.map(r => r.Name));
  };

  const selectAllUsers = () => {
    setSelectedUsers(users.map(u => u.Login));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Repository Access"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Repositories Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center text-sm font-medium">
              <FolderOpen className="w-4 h-4 mr-2" />
              Select Repositories
            </label>
            <Button
              type="button"
              onClick={selectAllRepos}
              variant="ghost"
              size="sm"
            >
              Select All
            </Button>
          </div>
          <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
            {repositories.map(repo => (
              <label key={repo.Id} className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedRepos.includes(repo.Name)}
                  onChange={() => toggleRepo(repo.Name)}
                />
                <span className="text-sm">{repo.Name}</span>
                {repo.Private && (
                  <span className="text-xs text-gray-500">(private)</span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Users Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center text-sm font-medium">
              <Users className="w-4 h-4 mr-2" />
              Select Users
            </label>
            <Button
              type="button"
              onClick={selectAllUsers}
              variant="ghost"
              size="sm"
            >
              Select All
            </Button>
          </div>
          <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
            {users.map(user => (
              <label key={user.Id} className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedUsers.includes(user.Login)}
                  onChange={() => toggleUser(user.Login)}
                />
                <img
                  src={user.AvatarUrl}
                  alt={user.Login}
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-sm">
                  {user.Name || user.Login} (@{user.Login})
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Permission Level */}
        <FormField
          label="Permission Level"
          icon={<Shield className="w-4 h-4" />}
          required
        >
          <Select
            value={permission}
            onChange={(e) => setPermission(e.target.value as 'read' | 'write' | 'admin')}
          >
            <option value="read">Read - Can view and clone</option>
            <option value="write">Write - Can push changes</option>
            <option value="admin">Admin - Full access</option>
          </Select>
        </FormField>

        {/* Summary */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Summary</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Grant <strong>{permission}</strong> access to{' '}
            <strong>{selectedRepos.length}</strong> repositories for{' '}
            <strong>{selectedUsers.length}</strong> users
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
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
            disabled={selectedRepos.length === 0 || selectedUsers.length === 0}
          >
            Update Access
          </Button>
        </div>
      </form>
    </Modal>
  );
};