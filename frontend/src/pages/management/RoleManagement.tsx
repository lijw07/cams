import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users,
  Eye,
  Crown,
  UserCheck
} from 'lucide-react';
import { roleService, Role } from '../../services/roleService';
import { useNotifications } from '../contexts/NotificationContext';

const RoleManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const rolesData = await roleService.getRoles();
      setRoles(rolesData);
    } catch (error) {
      console.error('Error loading roles:', error);
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleDeleteRole = async (roleId: number, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the role "${roleName}"? This action cannot be undone and will remove this role from all assigned users.`)) {
      return;
    }

    try {
      await roleService.deleteRole(roleId);
      toast.success('Role deleted successfully');
      loadRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Failed to delete role');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRoles.length === 0) {
      toast.error('Please select roles first');
      return;
    }

    const systemRoles = roles.filter(r => selectedRoles.includes(r.id) && r.isSystem);
    if (systemRoles.length > 0) {
      toast.error('Cannot delete system roles');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedRoles.length} role(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await roleService.bulkDeleteRoles(selectedRoles);
      toast.success(response.message);
      setSelectedRoles([]);
      loadRoles();
    } catch (error) {
      console.error('Error deleting roles:', error);
      toast.error('Failed to delete roles');
    }
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getRoleTypeIcon = (isSystem: boolean) => {
    return isSystem ? (
      <Crown className="w-4 h-4 text-yellow-500" />
    ) : (
      <Shield className="w-4 h-4 text-blue-500" />
    );
  };

  const getRoleTypeBadge = (isSystem: boolean) => {
    return (
      <span className={`badge ${isSystem ? 'badge-warning' : 'badge-secondary'}`}>
        {isSystem ? 'System' : 'Custom'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Role Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Manage system roles and permissions</p>
        </div>
        <button
          onClick={() => navigate('/management/roles/create')}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Role
        </button>
      </div>

      {/* Search and Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search roles by name or description..."
                className="input pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/management/roles/hierarchy')}
              className="btn btn-secondary"
            >
              View Hierarchy
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedRoles.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-red-900 dark:text-red-200">
                {selectedRoles.length} role(s) selected
              </span>
              <button
                onClick={handleBulkDelete}
                className="btn btn-sm btn-error"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete Selected
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Roles Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Loading roles...</p>
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No roles found</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {searchTerm ? 'No roles match your search criteria.' : 'Get started by creating your first role.'}
            </p>
            <button
              onClick={() => navigate('/management/roles/create')}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Role
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredRoles.map((role) => (
              <div key={role.id} className="card border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow dark:bg-gray-800">
                <div className="p-6">
                  {/* Role Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {getRoleTypeIcon(role.isSystem)}
                        <input
                          type="checkbox"
                          checked={selectedRoles.includes(role.id)}
                          onChange={(e) => {
                            setSelectedRoles(prev => 
                              e.target.checked 
                                ? [...prev, role.id]
                                : prev.filter(id => id !== role.id)
                            );
                          }}
                          disabled={role.isSystem}
                          className="rounded border-gray-300 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{role.name}</h3>
                        {getRoleTypeBadge(role.isSystem)}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/management/roles/${role.id}`)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {!role.isSystem && (
                        <>
                          <button
                            onClick={() => navigate(`/management/roles/${role.id}/edit`)}
                            className="p-1 text-gray-400 hover:text-yellow-600"
                            title="Edit Role"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRole(role.id, role.name)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Delete Role"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Role Description */}
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                    {role.description || 'No description provided'}
                  </p>

                  {/* Role Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Users className="w-4 h-4" />
                      <span>{role.userCount} user{role.userCount !== 1 ? 's' : ''}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/management/roles/${role.id}/users`)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Manage Users
                      </button>
                    </div>
                  </div>

                  {/* Role Created Date */}
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500">
                      Created {new Date(role.createdAt).toLocaleDateString()}
                      {role.updatedAt !== role.createdAt && (
                        <> • Updated {new Date(role.updatedAt).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Roles</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{roles.length}</p>
            </div>
            <Shield className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">System Roles</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {roles.filter(r => r.isSystem).length}
              </p>
            </div>
            <Crown className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Custom Roles</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {roles.filter(r => !r.isSystem).length}
              </p>
            </div>
            <UserCheck className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleManagementPage;