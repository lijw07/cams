import React from 'react';
import { Users, Plus, Search, Trash2 } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';

interface UserHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedUsers: string[];
  onCreateUser: () => void;
  onBulkDelete: () => void;
  totalUsers: number;
  filters: {
    isActive: boolean | undefined;
    sortBy: string;
    sortDirection: 'asc' | 'desc';
  };
  onFiltersChange: (filters: any) => void;
}

const UserHeader: React.FC<UserHeaderProps> = ({
  searchTerm,
  onSearchChange,
  selectedUsers,
  onCreateUser,
  onBulkDelete,
  totalUsers,
  filters,
  onFiltersChange
}) => {
  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' }
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Created Date' },
    { value: 'username', label: 'Username' },
    { value: 'email', label: 'Email' },
    { value: 'lastName', label: 'Last Name' }
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white flex items-center">
            <Users className="w-8 h-8 mr-3 text-primary-600" />
            User Management
          </h1>
          <p className="text-secondary-600 dark:text-secondary-300 mt-2">
            Manage user accounts, roles, and permissions across your organization
          </p>
        </div>
        <Button onClick={onCreateUser}>
          <Plus className="w-4 h-4 mr-2" />
          Create User
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Select
              value={filters.isActive?.toString() || ''}
              onChange={(e) => onFiltersChange({
                ...filters,
                isActive: e.target.value === '' ? undefined : e.target.value === 'true'
              })}
              options={statusOptions}
              className="min-w-32"
            />
            
            <Select
              value={filters.sortBy}
              onChange={(e) => onFiltersChange({
                ...filters,
                sortBy: e.target.value
              })}
              options={sortOptions}
              className="min-w-36"
            />

            <Button
              variant="secondary"
              size="sm"
              onClick={() => onFiltersChange({
                ...filters,
                sortDirection: filters.sortDirection === 'asc' ? 'desc' : 'asc'
              })}
            >
              {filters.sortDirection === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {selectedUsers.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-secondary-600 dark:text-secondary-300">
                {selectedUsers.length} selected
              </span>
              <Button
                variant="error"
                size="sm"
                onClick={onBulkDelete}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete Selected
              </Button>
            </div>
          )}
          
          <div className="text-sm text-secondary-600 dark:text-secondary-300">
            Total: {totalUsers} users
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserHeader;