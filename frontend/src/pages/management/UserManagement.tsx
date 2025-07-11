import React, { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import UserHeader from '../../components/management/UserHeader';
import UserTable from '../../components/management/UserTable';
import UserModal from '../../components/modals/UserModal';
import { useUserManagement } from '../../hooks/useUserManagement';
import { UserManagement, CreateUserRequest, UpdateUserRequest } from '../../services/usersService';
import { UserWithRoles } from '../../types/management';

const UserManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    users,
    loading,
    searchTerm,
    setSearchTerm,
    selectedUsers,
    setSelectedUsers,
    pagination,
    filters,
    setFilters,
    handlePageChange,
    handlePageSizeChange,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus
  } = useUserManagement();

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);

  const toggleUserSelection = (id: string) => {
    setSelectedUsers(prev => 
      prev.includes(id) 
        ? prev.filter(userId => userId !== id)
        : [...prev, id]
    );
  };

  const handleCreateUser = () => {
    setModalMode('create');
    setSelectedUser(null);
    setIsUserModalOpen(true);
  };

  const handleEditUser = (user: UserManagement) => {
    setModalMode('edit');
    // Convert UserManagement to UserWithRoles format
    const userWithRoles: UserWithRoles = {
      ...user,
      Roles: user.Roles || []
    };
    setSelectedUser(userWithRoles);
    setIsUserModalOpen(true);
  };

  const handleViewUser = (user: UserManagement) => {
    navigate(`/management/users/${user.Id}`);
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      await deleteUser(id);
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedUsers.length} selected users?`)) {
      for (const userId of selectedUsers) {
        await deleteUser(userId);
      }
      setSelectedUsers([]);
    }
  };

  const handleModalSubmit = async (data: CreateUserRequest | UpdateUserRequest) => {
    try {
      if (modalMode === 'create') {
        await createUser(data as CreateUserRequest);
      } else {
        await updateUser(data as UpdateUserRequest);
      }
      setIsUserModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <UserHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedUsers={selectedUsers}
        onCreateUser={handleCreateUser}
        onBulkDelete={handleBulkDelete}
        totalUsers={pagination.totalItems}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <UserTable
        users={users}
        loading={loading}
        selectedUsers={selectedUsers}
        onToggleUser={toggleUserSelection}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
        onToggleStatus={toggleUserStatus}
        onViewUser={handleViewUser}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setSelectedUser(null);
        }}
        onSubmit={handleModalSubmit}
        user={selectedUser || undefined}
        mode={modalMode}
      />
    </div>
  );
};

export default UserManagementPage;