import React, { useState, useEffect } from 'react';

import { 
  Github, 
  Users, 
  Shield, 
  Plus, 
  Search, 
  UserPlus, 
  UserMinus,
  FolderOpen,
  Lock,
  Unlock,
  RefreshCw,
  Mail
} from 'lucide-react';

import { useNotifications } from '../../contexts/NotificationContext';
import { githubManagementService } from '../../services/githubManagementService';
import { GitHubUser, GitHubRepository, RepositoryAccess, GitHubTeam } from '../../types/github';
import { Button, Card, Input, Modal, Select, LoadingSpinner } from '../../components/common';
import { GitHubUserModal } from '../../components/modals/GitHubUserModal';
import { RepositoryAccessModal } from '../../components/modals/RepositoryAccessModal';
import { GitHubTeamModal } from '../../components/modals/GitHubTeamModal';

const GitHubManagement: React.FC = () => {
  const { addNotification } = useNotifications();
  const [organization] = useState('your-org'); // TODO: Make this configurable
  
  // State management
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'repositories' | 'teams'>('users');
  
  // Data
  const [users, setUsers] = useState<GitHubUser[]>([]);
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [teams, setTeams] = useState<GitHubTeam[]>([]);
  const [selectedUser, setSelectedUser] = useState<GitHubUser | null>(null);
  const [userAccess, setUserAccess] = useState<RepositoryAccess[]>([]);
  
  // Modals
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  
  // Search
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [organization, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'users':
          const membersData = await githubManagementService.getOrganizationMembers(organization);
          setUsers(membersData);
          break;
        case 'repositories':
          const reposData = await githubManagementService.getOrganizationRepositories(organization);
          setRepositories(reposData);
          break;
        case 'teams':
          const teamsData = await githubManagementService.getOrganizationTeams(organization);
          setTeams(teamsData);
          break;
      }
    } catch (error) {
      addNotification({
        title: 'Failed to load data',
        message: `Could not load ${activeTab} data`,
        type: 'error',
        source: 'GitHub Management'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewUserAccess = async (user: GitHubUser) => {
    setSelectedUser(user);
    setLoading(true);
    try {
      const access = await githubManagementService.getUserRepositoryAccess(user.Login, organization);
      setUserAccess(access);
    } catch (error) {
      addNotification({
        title: 'Failed to load user access',
        message: 'Could not retrieve repository access for this user',
        type: 'error',
        source: 'GitHub Management'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (username: string) => {
    if (!confirm(`Are you sure you want to remove ${username} from the organization?`)) {
      return;
    }

    try {
      await githubManagementService.removeUserFromOrganization(organization, username);
      addNotification({
        title: 'User removed',
        message: `${username} has been removed from the organization`,
        type: 'success',
        source: 'GitHub Management'
      });
      loadData();
    } catch (error) {
      addNotification({
        title: 'Failed to remove user',
        message: 'Could not remove user from organization',
        type: 'error',
        source: 'GitHub Management'
      });
    }
  };

  const filteredUsers = users.filter(user => 
    user.Login.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.Email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRepos = repositories.filter(repo =>
    repo.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.Description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTeams = teams.filter(team =>
    team.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.Description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Github className="w-8 h-8 text-gray-900 dark:text-white" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            GitHub Management
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          {activeTab === 'users' && (
            <Button onClick={() => setShowCreateUserModal(true)} variant="primary">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite User
            </Button>
          )}
          {activeTab === 'repositories' && (
            <Button onClick={() => setShowAccessModal(true)} variant="primary">
              <Shield className="w-4 h-4 mr-2" />
              Manage Access
            </Button>
          )}
          {activeTab === 'teams' && (
            <Button onClick={() => setShowTeamModal(true)} variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Create Team
            </Button>
          )}
        </div>
      </div>

      {/* Organization Info */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Organization: {organization}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage users, repositories, and teams for your GitHub organization
            </p>
          </div>
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('repositories')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'repositories'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FolderOpen className="w-4 h-4 inline mr-2" />
            Repositories
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'teams'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Teams
          </button>
        </nav>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder={`Search ${activeTab}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {activeTab === 'users' && (
            <UsersList 
              users={filteredUsers}
              onViewAccess={handleViewUserAccess}
              onRemoveUser={handleRemoveUser}
            />
          )}
          {activeTab === 'repositories' && (
            <RepositoriesList repositories={filteredRepos} />
          )}
          {activeTab === 'teams' && (
            <TeamsList teams={filteredTeams} />
          )}
        </>
      )}

      {/* Selected User Access */}
      {selectedUser && userAccess.length > 0 && (
        <UserAccessPanel 
          user={selectedUser} 
          access={userAccess}
          onClose={() => {
            setSelectedUser(null);
            setUserAccess([]);
          }}
        />
      )}

      {/* Modals */}
      {showCreateUserModal && (
        <GitHubUserModal
          isOpen={showCreateUserModal}
          onClose={() => setShowCreateUserModal(false)}
          onSuccess={() => {
            setShowCreateUserModal(false);
            loadData();
          }}
        />
      )}

      {showAccessModal && (
        <RepositoryAccessModal
          isOpen={showAccessModal}
          organization={organization}
          repositories={repositories}
          users={users}
          onClose={() => setShowAccessModal(false)}
          onSuccess={() => {
            setShowAccessModal(false);
            loadData();
          }}
        />
      )}

      {showTeamModal && (
        <GitHubTeamModal
          isOpen={showTeamModal}
          organization={organization}
          onClose={() => setShowTeamModal(false)}
          onSuccess={() => {
            setShowTeamModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
};

// Sub-components
const UsersList: React.FC<{
  users: GitHubUser[];
  onViewAccess: (user: GitHubUser) => void;
  onRemoveUser: (username: string) => void;
}> = ({ users, onViewAccess, onRemoveUser }) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {users.map(user => (
      <Card key={user.Id} className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={user.AvatarUrl}
              alt={user.Login}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <h3 className="font-semibold">{user.Name || user.Login}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">@{user.Login}</p>
              {user.Email && (
                <p className="text-xs text-gray-500 dark:text-gray-500">{user.Email}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => onViewAccess(user)}
              variant="ghost"
              size="sm"
              title="View repository access"
            >
              <Shield className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => onRemoveUser(user.Login)}
              variant="ghost"
              size="sm"
              title="Remove from organization"
            >
              <UserMinus className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </div>
        {user.Teams.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-1">Teams:</p>
            <div className="flex flex-wrap gap-1">
              {user.Teams.map(team => (
                <span key={team} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">
                  {team}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>
    ))}
  </div>
);

const RepositoriesList: React.FC<{ repositories: GitHubRepository[] }> = ({ repositories }) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {repositories.map(repo => (
      <Card key={repo.Id} className="p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{repo.Name}</h3>
            {repo.Private ? (
              <Lock className="w-4 h-4 text-gray-500" />
            ) : (
              <Unlock className="w-4 h-4 text-green-500" />
            )}
          </div>
          {repo.Description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{repo.Description}</p>
          )}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{repo.DefaultBranch}</span>
            <span>{new Date(repo.UpdatedAt).toLocaleDateString()}</span>
          </div>
          {repo.Topics.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {repo.Topics.map(topic => (
                <span key={topic} className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                  {topic}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>
    ))}
  </div>
);

const TeamsList: React.FC<{ teams: GitHubTeam[] }> = ({ teams }) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {teams.map(team => (
      <Card key={team.Id} className="p-4">
        <div className="space-y-2">
          <h3 className="font-semibold">{team.Name}</h3>
          {team.Description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{team.Description}</p>
          )}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{team.MembersCount} members</span>
            <span>{team.ReposCount} repos</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{team.Privacy}</span>
            <span className="text-xs text-gray-500">{team.Permission}</span>
          </div>
        </div>
      </Card>
    ))}
  </div>
);

const UserAccessPanel: React.FC<{
  user: GitHubUser;
  access: RepositoryAccess[];
  onClose: () => void;
}> = ({ user, access, onClose }) => (
  <Card className="p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold">
        Repository Access for @{user.Login}
      </h3>
      <Button onClick={onClose} variant="ghost" size="sm">
        Close
      </Button>
    </div>
    <div className="space-y-2">
      {access.map((item, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
          <div>
            <p className="font-medium">{item.Repository}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {item.Source === 'direct' ? 'Direct access' : `Via ${item.Source}`}
            </p>
          </div>
          <span className={`px-3 py-1 text-sm rounded ${
            item.Permission === 'admin' ? 'bg-red-100 text-red-800' :
            item.Permission === 'write' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {item.Permission}
          </span>
        </div>
      ))}
    </div>
  </Card>
);

export default GitHubManagement;