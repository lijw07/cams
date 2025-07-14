import React, { useState } from 'react';

import { useUserModal } from '../../hooks/useUserModal';
import { UserWithRoles } from '../../types/management';
import Button from '../common/Button';
import Modal from '../common/Modal';
import UserFormFields from '../forms/UserFormFields';
import UserRoleSelection from '../forms/UserRoleSelection';

interface CreateUserRequest {
  Username: string;
  Email: string;
  Password: string;
  ConfirmPassword: string;
  FirstName: string;
  LastName: string;
  PhoneNumber?: string;
  IsActive: boolean;
}

interface UpdateUserRequest {
  Id: string;
  Username: string;
  Email: string;
  FirstName?: string;
  LastName?: string;
  PhoneNumber?: string;
  IsActive: boolean;
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserRequest | UpdateUserRequest, roleIds: string[]) => Promise<void>;
  user?: UserWithRoles;
  mode?: 'create' | 'edit';
}

const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  user,
  mode = 'create'
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    form: { register, handleSubmit, watch, errors, isSubmitting },
    roles,
    selectedRoles,
    isLoadingRoles,
    password,
    handleRoleToggle,
    handleFormSubmit,
    handleClose
  } = useUserModal({ isOpen, user, mode, onSubmit, onClose });

  const isActive = watch('IsActive');

  if (!isOpen) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      size="xl"
      title={mode === 'create' ? 'Create New User' : 'Edit User'}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Form Fields */}
          <div>
            <UserFormFields
              register={register}
              errors={errors}
              mode={mode}
              password={password}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
              showConfirmPassword={showConfirmPassword}
              onToggleConfirmPassword={() => setShowConfirmPassword(!showConfirmPassword)}
              isActive={isActive}
            />
          </div>

          {/* Role Selection */}
          <div>
            <UserRoleSelection
              roles={roles}
              selectedRoles={selectedRoles}
              onRoleToggle={handleRoleToggle}
              isLoading={isLoadingRoles}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700 mt-8">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            {mode === 'create' ? 'Create User' : 'Update User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UserModal;