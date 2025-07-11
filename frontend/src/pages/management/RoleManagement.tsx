import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users,
  Eye,
  Crown,
  UserCheck,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { roleService, Role, CreateRoleRequest, UpdateRoleRequest, PaginationRequest, PaginatedResponse } from '../../services/roleService';
import { useNotifications } from '../../contexts/NotificationContext';
import RoleModal from '../../components/modals/RoleModal';
import RoleUsersModal from '../../components/modals/RoleUsersModal';

const RoleManagementPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | undefined>(undefined);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [selectedRoleForUsers, setSelectedRoleForUsers] = useState<Role | null>(null);
  const { addNotification } = useNotifications();

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 20,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });

  const [filters, setFilters] = useState({
    sortBy: 'name',
    sortDirection: 'asc' as 'asc' | 'desc',
  });

  const loadRoles = async () => {
    try {
      setLoading(true);
      const request: PaginationRequest = {
        PageNumber: pagination.currentPage,
        PageSize: pagination.perPage,
        SortBy: filters.sortBy,
        SortDirection: filters.sortDirection,
        SearchTerm: searchTerm || undefined,
      };

      const response = await roleService.getRoles(request);
      setRoles(response.Data || []);
      setPagination({
        currentPage: response.Pagination.CurrentPage,
        perPage: response.Pagination.PerPage,
        totalItems: response.Pagination.TotalItems,
        totalPages: response.Pagination.TotalPages,
        hasNext: response.Pagination.HasNext,
        hasPrevious: response.Pagination.HasPrevious,
      });
    } catch (error) {
      console.error('Error loading roles:', error);
      addNotification({ 
        title: 'Error', 
        message: 'Failed to load roles', 
        type: 'error', 
        source: 'RoleManagement' 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, [pagination.currentPage, pagination.perPage, filters, searchTerm]);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination(prev => ({ 
      ...prev, 
      perPage: newPageSize, 
      currentPage: 1 // Reset to first page when changing page size
    }));
  };

  const handleCreateRole = async (data: CreateRoleRequest) => {
    try {
      await roleService.createRole(data);
      addNotification({ 
        title: 'Success', 
        message: 'Role created successfully', 
        type: 'success', 
        source: 'RoleManagement' 
      });
      loadRoles();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Error creating role:', error);
      addNotification({ 
        title: 'Error', 
        message: error.response?.data?.message || 'Failed to create role', 
        type: 'error', 
        source: 'RoleManagement' 
      });
      throw error;
    }
  };

  const handleUpdateRole = async (data: UpdateRoleRequest) => {
    try {
      await roleService.updateRole(data.Id, data);
      addNotification({ 
        title: 'Success', 
        message: 'Role updated successfully', 
        type: 'success', 
        source: 'RoleManagement' 
      });
      loadRoles();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Error updating role:', error);
      addNotification({ 
        title: 'Error', 
        message: error.response?.data?.message || 'Failed to update role', 
        type: 'error', 
        source: 'RoleManagement' 
      });
      throw error;
    }
  };

  const openCreateModal = () => {
    setEditingRole(undefined);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const openEditModal = (role: Role) => {
    setEditingRole(role);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const openUsersModal = (role: Role) => {
    setSelectedRoleForUsers(role);
    setIsUsersModalOpen(true);
  };

  const handleToggleRoleStatus = async (roleId: number, roleName: string, currentStatus: boolean) => {
    try {
      await roleService.toggleRoleStatus(roleId);
      
      const action = currentStatus ? 'deactivated' : 'activated';
      addNotification({ 
        title: 'Success', 
        message: `Role "${roleName}" has been ${action} successfully`, 
        type: 'success', 
        source: 'RoleManagement' 
      });
      
      // Update the local state immediately
      setRoles(prevRoles => 
        prevRoles.map(role => 
          role.Id === roleId ? { ...role, IsActive: !role.IsActive } : role
        )
      );
    } catch (error: any) {
      console.error('Error toggling role status:', error);
      const errorMessage = error.response?.data?.message || 'Failed to toggle role status';
      addNotification({ 
        title: 'Error', 
        message: errorMessage, 
        type: 'error', 
        source: 'RoleManagement' 
      });
    }
  };

  const handleDeleteRole = async (roleId: number, roleName: string) => {
    if (!confirm(`Are you sure you want to permanently delete the role "${roleName}"? This action cannot be undone and will remove this role from the database.`)) {
      return;
    }

    try {
      await roleService.deleteRole(roleId);
      
      addNotification({ 
        title: 'Success', 
        message: `Role "${roleName}" has been deleted successfully`, 
        type: 'success', 
        source: 'RoleManagement' 
      });
      
      // Immediately remove the role from the local state for instant feedback
      setRoles(prevRoles => prevRoles.filter(role => role.Id !== roleId));
      
      // Also reload from server to ensure consistency
      loadRoles();
    } catch (error: any) {
      console.error('Error deleting role:', error);
      
      // Extract detailed error information
      let errorMessage = 'Failed to delete role';
      let title = 'Delete Failed';
      
      if (error.response?.status === 400) {
        // Bad request - usually validation errors or business rule violations
        errorMessage = error.response.data?.message || error.response.data || 'Invalid request';
        title = 'Cannot Delete Role';
      } else if (error.response?.status === 404) {
        errorMessage = `Role "${roleName}" not found`;
        title = 'Role Not Found';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to delete this role';
        title = 'Permission Denied';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      addNotification({ 
        title: title, 
        message: errorMessage, 
        type: 'error', 
        source: 'RoleManagement' 
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRoles.length === 0) {
      addNotification({ 
        title: 'Error', 
        message: 'Please select roles first', 
        type: 'error', 
        source: 'RoleManagement' 
      });
      return;
    }

    const systemRoles = roles.filter(r => selectedRoles.includes(r.Id) && r.IsSystem);
    if (systemRoles.length > 0) {
      addNotification({ 
        title: 'Error', 
        message: 'Cannot delete system roles', 
        type: 'error', 
        source: 'RoleManagement' 
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedRoles.length} role(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await roleService.bulkDeleteRoles(selectedRoles);
      addNotification({ 
        title: 'Success', 
        message: response.Message || response.message || 'Roles deleted successfully', 
        type: 'success', 
        source: 'RoleManagement' 
      });
      
      // Immediately remove the deleted roles from the local state
      setRoles(prevRoles => prevRoles.filter(role => !selectedRoles.includes(role.Id)));
      setSelectedRoles([]);
      
      // Also reload from server to ensure consistency
      loadRoles();
    } catch (error: any) {
      console.error('Error deleting roles:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete roles';
      addNotification({ 
        title: 'Error', 
        message: errorMessage, 
        type: 'error', 
        source: 'RoleManagement' 
      });
    }
  };

  // Server-side filtering is now handled by the backend, so no need for client-side filtering

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
          onClick={openCreateModal}
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

          {/* Sorting and Filters */}
          <div className="flex gap-2">
            <select
              className="input"
              value={`${filters.sortBy}-${filters.sortDirection}`}
              onChange={(e) => {
                const [sortBy, sortDirection] = e.target.value.split('-');
                setFilters(prev => ({
                  ...prev,
                  sortBy,
                  sortDirection: sortDirection as 'asc' | 'desc'
                }));
              }}
            >
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="createdat-desc">Newest First</option>
              <option value="createdat-asc">Oldest First</option>
              <option value="updatedat-desc">Recently Updated</option>
              <option value="system-desc">System First</option>
              <option value="active-desc">Active First</option>
            </select>
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
        ) : roles.length === 0 ? (
          <div className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No roles found</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {searchTerm ? 'No roles match your search criteria.' : 'Get started by creating your first role.'}
            </p>
            <button
              onClick={openCreateModal}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Role
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {roles.map((role) => (
              <div 
                key={role.Id} 
                className={`card border transition-shadow dark:bg-gray-800 ${
                  role.IsActive 
                    ? 'border-gray-200 dark:border-gray-700 hover:shadow-lg' 
                    : 'border-red-200 dark:border-red-800 opacity-75 hover:opacity-90'
                } ${
                  role.IsSystem ? 'cursor-not-allowed' : 'cursor-pointer'
                }`}
                onClick={() => !role.IsSystem && openEditModal(role)}
                title={
                  role.IsSystem 
                    ? 'System roles cannot be edited' 
                    : 'Click to edit role'
                }
              >
                <div className="p-6">
                  {/* Role Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {getRoleTypeIcon(role.IsSystem)}
                        <input
                          type="checkbox"
                          checked={selectedRoles.includes(role.Id)}
                          onChange={(e) => {
                            setSelectedRoles(prev => 
                              e.target.checked 
                                ? [...prev, role.Id]
                                : prev.filter(id => id !== role.Id)
                            );
                          }}
                          onClick={(e) => e.stopPropagation()}
                          disabled={role.IsSystem}
                          className="rounded border-gray-300 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          {role.Name}
                          {!role.IsActive && (
                            <span className="text-xs text-red-600 dark:text-red-400">(Inactive)</span>
                          )}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {getRoleTypeBadge(role.IsSystem)}
                          {!role.IsActive && (
                            <span className="badge badge-error">Inactive</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openUsersModal(role);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Manage Users"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {!role.IsSystem && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleRoleStatus(role.Id, role.Name, role.IsActive);
                            }}
                            className={`p-1 ${
                              role.IsActive 
                                ? 'text-gray-400 hover:text-red-600' 
                                : 'text-green-600 hover:text-green-700'
                            }`}
                            title={role.IsActive ? 'Deactivate Role' : 'Activate Role'}
                          >
                            {role.IsActive ? (
                              <ToggleRight className="w-4 h-4" />
                            ) : (
                              <ToggleLeft className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(role);
                            }}
                            className="p-1 text-gray-400 hover:text-yellow-600"
                            title="Edit Role"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRole(role.Id, role.Name);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Permanently Delete Role"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Role Description */}
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                    {role.Description || 'No description provided'}
                  </p>

                  {/* Role Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Users className="w-4 h-4" />
                      <span>{role.UserCount} user{role.UserCount !== 1 ? 's' : ''}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openUsersModal(role);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Manage Users
                      </button>
                    </div>
                  </div>

                  {/* Role Created Date */}
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500">
                      Created {new Date(role.CreatedAt).toLocaleDateString()}
                      {role.UpdatedAt !== role.CreatedAt && (
                        <> • Updated {new Date(role.UpdatedAt).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            </div>

            {/* Pagination */}
            <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing {((pagination.currentPage - 1) * pagination.perPage) + 1} to {Math.min(pagination.currentPage * pagination.perPage, pagination.totalItems)} of {pagination.totalItems} roles
                  </div>
                  
                  {/* Page size selector */}
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-700 dark:text-gray-300">Show:</label>
                    <select
                      value={pagination.perPage}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="text-sm text-gray-700 dark:text-gray-300">per page</span>
                  </div>
                </div>

                {/* Navigation buttons */}
                <div className="flex items-center space-x-1">
                  {/* First page */}
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={!pagination.hasPrevious}
                    className={`px-3 py-1 text-sm font-medium rounded-md ${
                      !pagination.hasPrevious
                        ? 'text-gray-400 bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
                        : 'text-primary-600 hover:text-primary-900 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    First
                  </button>
                  
                  {/* Previous page */}
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevious}
                    className={`px-3 py-1 text-sm font-medium rounded-md ${
                      !pagination.hasPrevious
                        ? 'text-gray-400 bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
                        : 'text-primary-600 hover:text-primary-900 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    Previous
                  </button>

                  {/* Page numbers */}
                  {(() => {
                    const pageNumbers = [];
                    const maxVisible = 5;
                    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2));
                    let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);
                    
                    if (endPage - startPage + 1 < maxVisible) {
                      startPage = Math.max(1, endPage - maxVisible + 1);
                    }

                    for (let i = startPage; i <= endPage; i++) {
                      pageNumbers.push(
                        <button
                          key={i}
                          onClick={() => handlePageChange(i)}
                          className={`px-3 py-1 text-sm font-medium rounded-md ${
                            pagination.currentPage === i
                              ? 'bg-primary-600 text-white'
                              : 'text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }
                    return pageNumbers;
                  })()}

                  {/* Next page */}
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className={`px-3 py-1 text-sm font-medium rounded-md ${
                      !pagination.hasNext
                        ? 'text-gray-400 bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
                        : 'text-primary-600 hover:text-primary-900 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    Next
                  </button>
                  
                  {/* Last page */}
                  <button
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={!pagination.hasNext}
                    className={`px-3 py-1 text-sm font-medium rounded-md ${
                      !pagination.hasNext
                        ? 'text-gray-400 bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
                        : 'text-primary-600 hover:text-primary-900 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Role Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Roles</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{pagination.totalItems}</p>
            </div>
            <Shield className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">System Roles</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {roles.filter(r => r.IsSystem).length}
              </p>
            </div>
            <Crown className="w-8 h-8 text-yellow-500" />
          </div>
          <p className="text-xs text-gray-500 mt-2">On current page</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Custom Roles</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {roles.filter(r => !r.IsSystem).length}
              </p>
            </div>
            <UserCheck className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-xs text-gray-500 mt-2">On current page</p>
        </div>
      </div>

      {/* Role Modal */}
      <RoleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={modalMode === 'create' ? handleCreateRole : handleUpdateRole}
        role={editingRole}
        mode={modalMode}
      />

      {/* Role Users Modal */}
      {selectedRoleForUsers && (
        <RoleUsersModal
          isOpen={isUsersModalOpen}
          onClose={() => {
            setIsUsersModalOpen(false);
            setSelectedRoleForUsers(null);
            // Reload roles to update user counts
            loadRoles();
          }}
          role={selectedRoleForUsers}
        />
      )}
    </div>
  );
};

export default RoleManagementPage;