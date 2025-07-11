import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Power, 
  Shield, 
  Eye
} from 'lucide-react';
import { usersService, UserManagement, PaginationRequest } from '../../services/usersService';
import { useNotifications } from '../../contexts/NotificationContext';
import UserModal from '../../components/modals/UserModal';

const UserManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserManagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 20,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });

  const [filters, setFilters] = useState({
    isActive: undefined as boolean | undefined,
    sortBy: 'createdAt',
    sortDirection: 'desc' as 'asc' | 'desc',
  });

  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const { addNotification } = useNotifications();
  
  // Modal state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<UserManagement | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const request: PaginationRequest = {
        PageNumber: pagination.currentPage,
        PageSize: pagination.perPage,
        SortBy: filters.sortBy,
        SortDirection: filters.sortDirection,
        SearchTerm: searchTerm || undefined,
      };

      const response = await usersService.getUsers(request);
      setUsers(response.Data || []);
      setPagination({
        currentPage: response.Pagination.CurrentPage,
        perPage: response.Pagination.PerPage,
        totalItems: response.Pagination.TotalItems,
        totalPages: response.Pagination.TotalPages,
        hasNext: response.Pagination.HasNext,
        hasPrevious: response.Pagination.HasPrevious,
      });
    } catch (error) {
      console.error('Error loading users:', error);
      addNotification({ 
        title: 'Error', 
        message: 'Failed to load users', 
        type: 'error', 
        source: 'UserManagement' 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [pagination.currentPage, pagination.perPage, filters, searchTerm]);

  const handleToggleUserStatus = async (userId: number, isActive: boolean) => {
    try {
      await usersService.toggleUserStatus(userId, !isActive);
      addNotification({ 
        title: 'Success', 
        message: `User ${!isActive ? 'activated' : 'deactivated'} successfully`, 
        type: 'success', 
        source: 'UserManagement' 
      });
      loadUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      addNotification({ 
        title: 'Error', 
        message: 'Failed to update user status', 
        type: 'error', 
        source: 'UserManagement' 
      });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await usersService.deleteUser(userId);
      addNotification({ 
        title: 'Success', 
        message: 'User deleted successfully', 
        type: 'success', 
        source: 'UserManagement' 
      });
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      addNotification({ 
        title: 'Error', 
        message: 'Failed to delete user', 
        type: 'error', 
        source: 'UserManagement' 
      });
    }
  };

  const handleBulkStatusToggle = async (isActive: boolean) => {
    if (selectedUsers.length === 0) {
      addNotification({ 
        title: 'Error', 
        message: 'Please select users first', 
        type: 'error', 
        source: 'UserManagement' 
      });
      return;
    }

    try {
      const response = await usersService.bulkToggleStatus(selectedUsers, isActive);
      addNotification({ 
        title: 'Success', 
        message: response.message, 
        type: 'success', 
        source: 'UserManagement' 
      });
      setSelectedUsers([]);
      loadUsers();
    } catch (error) {
      console.error('Error updating users status:', error);
      addNotification({ 
        title: 'Error', 
        message: 'Failed to update users status', 
        type: 'error', 
        source: 'UserManagement' 
      });
    }
  };

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

  // Modal handlers
  const handleCreateUser = () => {
    setModalMode('create');
    setSelectedUser(null);
    setIsUserModalOpen(true);
  };

  const handleEditUser = async (userId: number) => {
    try {
      const user = await usersService.getUser(userId);
      setModalMode('edit');
      setSelectedUser(user);
      setIsUserModalOpen(true);
    } catch (error) {
      console.error('Error loading user for edit:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to load user for editing',
        type: 'error',
        source: 'UserManagement'
      });
    }
  };

  const handleUserModalSubmit = async (data: any, roleIds: number[]) => {
    try {
      if (modalMode === 'create') {
        // For create mode, the backend accepts RoleIds in the CreateUserRequest
        await usersService.createUser({
          ...data,
          RoleIds: roleIds
        });
        addNotification({
          title: 'Success',
          message: 'User created successfully',
          type: 'success',
          source: 'UserManagement'
        });
      } else if (modalMode === 'edit' && selectedUser) {
        // For edit mode, update user info and roles separately
        
        // 1. Update basic user information (excluding roles)
        await usersService.updateUser(selectedUser.Id, {
          Id: selectedUser.Id,
          Username: selectedUser.Username, // Keep original username (backend requirement)
          Email: data.Email,
          FirstName: data.FirstName || null,
          LastName: data.LastName || null,
          PhoneNumber: data.PhoneNumber || null,
          IsActive: data.IsActive
        });
        
        // 2. Update roles separately if they changed
        const currentRoleIds = selectedUser.Roles.map(r => r.Id).sort();
        const newRoleIds = roleIds.sort();
        
        if (JSON.stringify(newRoleIds) !== JSON.stringify(currentRoleIds)) {
          await usersService.updateUserRoles(selectedUser.Id, roleIds);
        }

        addNotification({
          title: 'Success',
          message: 'User updated successfully',
          type: 'success',
          source: 'UserManagement'
        });
      }
      
      loadUsers(); // Refresh the list
    } catch (error: any) {
      console.error('Error submitting user:', error);
      addNotification({
        title: 'Error',
        message: error.response?.data?.message || `Failed to ${modalMode} user`,
        type: 'error',
        source: 'UserManagement'
      });
      throw error; // Re-throw to let modal handle the error
    }
  };

  const getRolesBadge = (roles: Array<{ Id: number; Name: string; Description: string; IsActive: boolean; CreatedAt: string; UpdatedAt: string }>) => {
    if (roles.length === 0) return <span className="text-gray-500">No roles</span>;
    
    return (
      <div className="flex flex-wrap gap-1">
        {roles.slice(0, 2).map((role, index) => (
          <span key={index} className="badge badge-secondary text-xs">
            {role.Name}
          </span>
        ))}
        {roles.length > 2 && (
          <span className="text-xs text-gray-500">+{roles.length - 2} more</span>
        )}
      </div>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`badge ${isActive ? 'badge-success' : 'badge-secondary'}`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6" />
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Manage system users, roles, and permissions</p>
        </div>
        <button
          onClick={handleCreateUser}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create User
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users by name, email, or username..."
                className="input pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              className="input"
              value={filters.isActive?.toString() || ''}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                isActive: e.target.value === '' ? undefined : e.target.value === 'true'
              }))}
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

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
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="username-asc">Username A-Z</option>
              <option value="username-desc">Username Z-A</option>
              <option value="email-asc">Email A-Z</option>
              <option value="lastLoginAt-desc">Last Login</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                {selectedUsers.length} user(s) selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkStatusToggle(true)}
                  className="btn btn-sm btn-success"
                >
                  Activate Selected
                </button>
                <button
                  onClick={() => handleBulkStatusToggle(false)}
                  className="btn btn-sm btn-secondary"
                >
                  Deactivate Selected
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Loading users...</p>
          </div>
        ) : !users || users.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No users found</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {searchTerm ? 'No users match your search criteria.' : 'Get started by creating your first user.'}
            </p>
            <button
              onClick={handleCreateUser}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create User
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={users && selectedUsers.length === users.length}
                        onChange={(e) => {
                          setSelectedUsers(e.target.checked ? (users || []).map(u => u.Id) : []);
                        }}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Roles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resources
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {(users || []).map((user) => (
                    <tr 
                      key={user.Id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => handleEditUser(user.Id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.Id)}
                          onChange={(e) => {
                            setSelectedUsers(prev => 
                              e.target.checked 
                                ? [...prev, user.Id]
                                : prev.filter(id => id !== user.Id)
                            );
                          }}
                          className="rounded border-gray-300 dark:border-gray-600"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                            {user.FirstName?.[0] || user.Username?.[0] || 'U'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.FirstName && user.LastName 
                                ? `${user.FirstName} ${user.LastName}`
                                : user.Username
                              }
                            </div>
                            <div className="text-sm text-gray-500">{user.Email}</div>
                            <div className="text-xs text-gray-400">@{user.Username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRolesBadge(user.Roles)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user.IsActive)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="space-y-1">
                          <div>{user.ApplicationCount} apps</div>
                          <div>{user.DatabaseConnectionCount} connections</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.LastLoginAt 
                          ? new Date(user.LastLoginAt).toLocaleDateString()
                          : 'Never'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/management/users/${user.Id}`)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditUser(user.Id)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/management/users/${user.Id}/roles`)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Manage Roles"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(user.Id, user.IsActive)}
                            className={`${user.IsActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                            title={user.IsActive ? 'Deactivate' : 'Activate'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.Id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Enhanced Pagination */}
            <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing {((pagination.currentPage - 1) * pagination.perPage) + 1} to {Math.min(pagination.currentPage * pagination.perPage, pagination.totalItems)} of {pagination.totalItems} users
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

      {/* User Modal */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSubmit={handleUserModalSubmit}
        user={selectedUser}
        mode={modalMode}
      />
    </div>
  );
};

export default UserManagementPage;