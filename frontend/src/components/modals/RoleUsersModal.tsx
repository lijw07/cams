import React from 'react';

import { Users, X, Search, Save, RotateCcw } from 'lucide-react';

import { useRoleUsers } from '../../hooks/useRoleUsers';
import { Role } from '../../services/roleService';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';

import RoleUsersTable from './RoleUsersTable';

interface RoleUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role | null;
}

const RoleUsersModal: React.FC<RoleUsersModalProps> = ({
  isOpen,
  onClose,
  role
}) => {
  const {
    roleUsers,
    allUsers,
    allRoles,
    loading,
    saving,
    searchTerm,
    setSearchTerm,
    changes,
    handleRoleChange,
    saveChanges,
    resetChanges,
    hasChanges
  } = useRoleUsers(role, isOpen);

  if (!isOpen || !role) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <Users className="w-6 h-6 text-primary-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Manage Users for {role.Name}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Assign or remove users from this role
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex space-x-2">
            {hasChanges && (
              <>
                <Button
                  variant="secondary"
                  onClick={resetChanges}
                  disabled={saving}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <Button
                  onClick={saveChanges}
                  disabled={saving}
                  loading={saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes ({changes.size})
                </Button>
              </>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Loading users...</p>
          </div>
        ) : (
          <RoleUsersTable
            users={allUsers}
            role={role}
            roleUsers={roleUsers}
            allRoles={allRoles}
            changes={changes}
            onRoleChange={handleRoleChange}
          />
        )}
      </div>
    </Modal>
  );
};

export default RoleUsersModal;