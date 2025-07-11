import React from 'react';
import { 
  Shield, 
  Edit, 
  Trash2, 
  Users,
  Eye,
  Crown,
  UserCheck,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Role } from '../../services/roleService';
import Button from '../common/Button';
import Pagination from '../common/Pagination';

interface RoleTableProps {
  roles: Role[];
  loading: boolean;
  selectedRoles: string[];
  onToggleRole: (id: string) => void;
  onEditRole: (role: Role) => void;
  onDeleteRole: (id: string) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
  onViewUsers: (role: Role) => void;
  pagination: {
    currentPage: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

const RoleTable: React.FC<RoleTableProps> = ({
  roles,
  loading,
  selectedRoles,
  onToggleRole,
  onEditRole,
  onDeleteRole,
  onToggleStatus,
  onViewUsers,
  pagination,
  onPageChange,
  onPageSizeChange
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
                  checked={selectedRoles.length === roles.length && roles.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      roles.forEach(role => onToggleRole(role.Id));
                    } else {
                      roles.forEach(role => onToggleRole(role.Id));
                    }
                  }}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Users
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
            {roles.map((role) => {
              const IconComponent = getRoleIcon(role);
              const iconColor = getRoleColor(role);
              
              return (
                <tr 
                  key={role.Id} 
                  className="hover:bg-gray-50 dark:hover:bg-secondary-700 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role.Id)}
                      onChange={() => onToggleRole(role.Id)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <IconComponent className={`h-5 w-5 ${iconColor} mr-3 flex-shrink-0`} />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {role.Name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {role.IsSystem ? 'System Role' : 'Custom Role'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                      {role.Description || 'No description'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {role.UserCount || 0}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => onToggleStatus(role.Id, !role.IsActive)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        role.IsActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {role.IsActive ? (
                        <ToggleRight className="w-3 h-3 mr-1" />
                      ) : (
                        <ToggleLeft className="w-3 h-3 mr-1" />
                      )}
                      {role.IsActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onViewUsers(role)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onEditRole(role)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="error"
                        size="sm"
                        onClick={() => onDeleteRole(role.Id)}
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
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
};

export default RoleTable;