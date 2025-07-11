import React from 'react';
import { Shield, Users, Lock } from 'lucide-react';

interface Role {
  Id: string;
  Name: string;
  IsSystem: boolean;
}

interface UserRoleSelectorProps {
  roles: Role[];
  selectedRoles: string[];
  onRoleToggle: (roleId: string) => void;
}

const UserRoleSelector: React.FC<UserRoleSelectorProps> = ({
  roles,
  selectedRoles,
  onRoleToggle
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center mb-4">
        <Shield className="w-5 h-5 text-primary-600 mr-2" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">User Roles</h3>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Select the roles to assign to this user. Roles determine what the user can access and do.
      </p>

      <div className="space-y-3">
        {roles.map((role) => (
          <div key={role.Id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id={`role-${role.Id}`}
                checked={selectedRoles.includes(role.Id)}
                onChange={() => onRoleToggle(role.Id)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <div>
                <label
                  htmlFor={`role-${role.Id}`}
                  className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
                >
                  {role.Name}
                </label>
                <div className="flex items-center mt-1">
                  {role.IsSystem ? (
                    <div className="flex items-center text-xs text-yellow-600 dark:text-yellow-400">
                      <Lock className="w-3 h-3 mr-1" />
                      System Role
                    </div>
                  ) : (
                    <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                      <Users className="w-3 h-3 mr-1" />
                      Custom Role
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {roles.length === 0 && (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No roles available</p>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="text-sm text-blue-800 dark:text-blue-200">
          <p className="font-medium mb-1">Role Assignment Tips:</p>
          <ul className="text-xs space-y-1">
            <li>• Assign the minimum roles needed for the user's responsibilities</li>
            <li>• System roles cannot be modified or deleted</li>
            <li>• Role changes take effect immediately after saving</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UserRoleSelector;