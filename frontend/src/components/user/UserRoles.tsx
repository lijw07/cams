import React from 'react';

import { Shield } from 'lucide-react';

interface Role {
  Id: string;
  Name: string;
  IsSystem: boolean;
}

interface UserRolesProps {
  roles: Role[];
  selectedRoles: string[];
  onRoleToggle: (roleId: string) => void;
}

export const UserRoles: React.FC<UserRolesProps> = ({
  roles,
  selectedRoles,
  onRoleToggle
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Shield className="w-5 h-5" />
          User Roles
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <div
            key={role.Id}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedRoles.includes(role.Id)
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => onRoleToggle(role.Id)}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900 dark:text-white">{role.Name}</span>
              <input
                type="checkbox"
                checked={selectedRoles.includes(role.Id)}
                onChange={() => {}}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </div>
            {role.IsSystem && (
              <span className="text-xs text-gray-500 dark:text-gray-400">System Role</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};