import React, { useState } from 'react';

import RoleHeader from '../../components/management/RoleHeader';
import RoleTable from '../../components/management/RoleTable';
import RoleModal from '../../components/modals/RoleModal';
import RoleUsersModal from '../../components/modals/RoleUsersModal';
import { useRoleManagement } from '../../hooks/useRoleManagement';
import { Role, CreateRoleRequest, UpdateRoleRequest } from '../../services/roleService';

const RoleManagementPage: React.FC = () => {
  const {
    roles,
    loading,
    searchTerm,
    setSearchTerm,
    selectedRoles,
    setSelectedRoles,
    pagination,
    handlePageChange,
    handlePageSizeChange,
    createRole,
    updateRole,
    deleteRole,
    toggleRoleStatus
  } = useRoleManagement();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | undefined>(undefined);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [selectedRoleForUsers, setSelectedRoleForUsers] = useState<Role | null>(null);

  const toggleRoleSelection = (id: string) => {
    setSelectedRoles(prev => 
      prev.includes(id) 
        ? prev.filter(roleId => roleId !== id)
        : [...prev, id]
    );
  };

  const handleCreateRole = () => {
    setModalMode('create');
    setEditingRole(undefined);
    setIsModalOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setModalMode('edit');
    setEditingRole(role);
    setIsModalOpen(true);
  };

  const handleDeleteRole = async (id: string) => {
    if (confirm('Are you sure you want to delete this role?')) {
      await deleteRole(id);
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedRoles.length} selected roles?`)) {
      for (const roleId of selectedRoles) {
        await deleteRole(roleId);
      }
      setSelectedRoles([]);
    }
  };

  const handleViewUsers = (role: Role) => {
    setSelectedRoleForUsers(role);
    setIsUsersModalOpen(true);
  };

  const handleModalSubmit = async (data: CreateRoleRequest | UpdateRoleRequest) => {
    try {
      if (modalMode === 'create') {
        await createRole(data as CreateRoleRequest);
      } else {
        await updateRole(data as UpdateRoleRequest);
      }
      setIsModalOpen(false);
      setEditingRole(undefined);
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <RoleHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedRoles={selectedRoles}
        onCreateRole={handleCreateRole}
        onBulkDelete={handleBulkDelete}
        totalRoles={pagination.totalItems}
      />

      <RoleTable
        roles={roles}
        loading={loading}
        selectedRoles={selectedRoles}
        onToggleRole={toggleRoleSelection}
        onEditRole={handleEditRole}
        onDeleteRole={handleDeleteRole}
        onToggleStatus={toggleRoleStatus}
        onViewUsers={handleViewUsers}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      <RoleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRole(undefined);
        }}
        onSubmit={handleModalSubmit}
        role={editingRole}
        mode={modalMode}
      />

      <RoleUsersModal
        isOpen={isUsersModalOpen}
        onClose={() => {
          setIsUsersModalOpen(false);
          setSelectedRoleForUsers(null);
        }}
        role={selectedRoleForUsers}
      />
    </div>
  );
};

export default RoleManagementPage;