import React from 'react';

import { Shield, Crown, UserCheck, AlertCircle } from 'lucide-react';

interface Role {
  Id: string;
  Name: string;
  IsSystem: boolean;
}

interface UserRoleSelectionProps {
  roles: Role[];
  selectedRoles: string[];
  onRoleToggle: (roleId: string) => void;
  isLoading: boolean;
}

const UserRoleSelection: React.FC<UserRoleSelectionProps> = ({
  roles,
  selectedRoles,
  onRoleToggle,
  isLoading
}) => {
  const getRoleIcon = (role: Role) => {
    if (role.Name.toLowerCase().includes('admin')) return Crown;
    if (role.Name.toLowerCase().includes('manager')) return UserCheck;
    return Shield;
  };

  const getRoleColor = (role: Role) => {
    if (role.Name.toLowerCase().includes('admin')) return 'text-red-600';
    if (role.Name.toLowerCase().includes('manager')) return 'text-blue-600';
    return 'text-green-600';
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
        <Shield className="w-5 h-5 mr-2" />
        Role Assignment
      </h3>

      {roles.length === 0 ? (
        <div className="text-center py-8">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No roles available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {roles.map((role) => {
            const IconComponent = getRoleIcon(role);
            const iconColor = getRoleColor(role);
            const isSelected = selectedRoles.includes(role.Id);
            
            return (
              <div
                key={role.Id}
                className={`
                  flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
                  ${isSelected 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
                onClick={() => onRoleToggle(role.Id)}
              >
                <div className="flex items-center flex-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onRoleToggle(role.Id)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-4"
                  />
                  
                  <IconComponent className={`h-5 w-5 ${iconColor} mr-3 flex-shrink-0`} />
                  
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {role.Name}
                      </span>
                      {role.IsSystem && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          System
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedRoles.length > 0 && (
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-medium mb-1">Selected Roles: {selectedRoles.length}</p>
              <p className="text-xs">
                User will have permissions from all selected roles. Be careful with administrative roles.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRoleSelection;