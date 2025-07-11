import React from 'react';

import { Shield, Plus, Search, Trash2 } from 'lucide-react';

import Button from '../common/Button';
import Input from '../common/Input';

interface RoleHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedRoles: string[];
  onCreateRole: () => void;
  onBulkDelete: () => void;
  totalRoles: number;
}

const RoleHeader: React.FC<RoleHeaderProps> = ({
  searchTerm,
  onSearchChange,
  selectedRoles,
  onCreateRole,
  onBulkDelete,
  totalRoles
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white flex items-center">
            <Shield className="w-8 h-8 mr-3 text-primary-600" />
            Role Management
          </h1>
          <p className="text-secondary-600 dark:text-secondary-300 mt-2">
            Manage user roles and permissions across your organization
          </p>
        </div>
        <Button onClick={onCreateRole}>
          <Plus className="w-4 h-4 mr-2" />
          Create Role
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {selectedRoles.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-secondary-600 dark:text-secondary-300">
                {selectedRoles.length} selected
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
            Total: {totalRoles} roles
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleHeader;