import React from 'react';

import { UserCheck, UserX } from 'lucide-react';

import { Role } from '../../services/roleService';
import { UserManagement } from '../../services/usersService';

interface UserRoleChange {
  userId: string;
  username: string;
  currentRole: Role;
  newRoleId: string | null;
  action: 'assign' | 'remove' | 'change' | 'none';
}

interface RoleUsersTableProps {
  users: UserManagement[];
  role: Role;
  roleUsers: any[];
  allRoles: Role[];
  changes: Map<string, UserRoleChange>;
  onRoleChange: (userId: string, newRoleId: string | null) => void;
}

const RoleUsersTable: React.FC<RoleUsersTableProps> = ({
  users,
  role,
  roleUsers,
  allRoles,
  changes,
  onRoleChange
}) => {
  return (
    <div className="max-h-96 overflow-y-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-secondary-700 sticky top-0">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Current Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-secondary-800 divide-y divide-gray-200 dark:divide-gray-700">
          {users.map((user) => {
            const userRole = roleUsers.find(ru => ru.UserId === user.Id);
            const hasRole = Boolean(userRole);
            const change = changes.get(user.Id);
            
            return (
              <tr key={user.Id} className="hover:bg-gray-50 dark:hover:bg-secondary-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {user.IsActive ? (
                      <UserCheck className="h-5 w-5 text-green-600 mr-3" />
                    ) : (
                      <UserX className="h-5 w-5 text-red-600 mr-3" />
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.Username}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.Email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {hasRole ? role.Name : 'No role assigned'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={change?.newRoleId || (hasRole ? role.Id : '')}
                    onChange={(e) => {
                      const newRoleId = e.target.value || null;
                      onRoleChange(user.Id, newRoleId);
                    }}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-secondary-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="">Remove from role</option>
                    {allRoles.map((r) => (
                      <option key={r.Id} value={r.Id}>
                        {r.Name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default RoleUsersTable;