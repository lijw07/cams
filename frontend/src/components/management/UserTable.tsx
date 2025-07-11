import React from 'react';
import { 
  Edit, 
  Trash2, 
  Power, 
  Shield, 
  Eye,
  UserCheck,
  UserX
} from 'lucide-react';
import { UserManagement } from '../../services/usersService';
import Button from '../common/Button';
import Pagination from '../common/Pagination';

interface UserTableProps {
  users: UserManagement[];
  loading: boolean;
  selectedUsers: string[];
  onToggleUser: (id: string) => void;
  onEditUser: (user: UserManagement) => void;
  onDeleteUser: (id: string) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
  onViewUser: (user: UserManagement) => void;
  pagination: {
    currentPage: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  onPageChange: (page: number) => void;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  loading,
  selectedUsers,
  onToggleUser,
  onEditUser,
  onDeleteUser,
  onToggleStatus,
  onViewUser,
  pagination,
  onPageChange
}) => {
  const getUserStatusIcon = (user: UserManagement) => {
    return user.IsActive ? UserCheck : UserX;
  };

  const getUserStatusColor = (user: UserManagement) => {
    return user.IsActive ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm">
        <div className="animate-pulse p-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-secondary-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      users.forEach(user => onToggleUser(user.Id));
                    } else {
                      users.forEach(user => onToggleUser(user.Id));
                    }
                  }}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Roles
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-secondary-800 divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user) => {
              const StatusIcon = getUserStatusIcon(user);
              const statusColor = getUserStatusColor(user);
              
              return (
                <tr 
                  key={user.Id} 
                  className="hover:bg-gray-50 dark:hover:bg-secondary-700 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.Id)}
                      onChange={() => onToggleUser(user.Id)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <StatusIcon className={`h-5 w-5 ${statusColor} mr-3 flex-shrink-0`} />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.Username}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.FirstName} {user.LastName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {user.Email}
                    </div>
                    {user.PhoneNumber && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.PhoneNumber}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {user.Roles?.length || 0} roles
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => onToggleStatus(user.Id, !user.IsActive)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        user.IsActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}
                    >
                      <Power className="w-3 h-3 mr-1" />
                      {user.IsActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onViewUser(user)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onEditUser(user)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="error"
                        size="sm"
                        onClick={() => onDeleteUser(user.Id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        pageSize={pagination.perPage}
        onPageChange={onPageChange}
      />
    </div>
  );
};

export default UserTable;