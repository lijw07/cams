import React, { useEffect } from 'react';

import { useForm } from 'react-hook-form';

import { X, Shield, Info, AlertCircle } from 'lucide-react';

import { CreateRoleRequest, UpdateRoleRequest, Role } from '../../services/roleService';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRoleRequest | UpdateRoleRequest) => Promise<void>;
  role?: Role;
  mode?: 'create' | 'edit';
}

const RoleModal: React.FC<RoleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  role,
  mode = 'create'
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<CreateRoleRequest | UpdateRoleRequest>({
    defaultValues: {
      Name: '',
      Description: ''
    }
  });

  useEffect(() => {
    if (role && mode === 'edit') {
      reset({
        Id: role.Id,
        Name: role.Name,
        Description: role.Description || ''
      });
    } else {
      reset({
        Name: '',
        Description: ''
      });
    }
  }, [role, mode, reset]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  const handleFormSubmit = async (data: CreateRoleRequest | UpdateRoleRequest) => {
    try {
      await onSubmit(data);
      reset();
      onClose();
    } catch (error) {
      console.error('Error submitting role:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
        />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full dark:bg-gray-800">
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {mode === 'create' ? 'Create New Role' : `Edit Role: ${role?.Name}`}
                    </h3>
                    <p className="text-sm text-primary-100 mt-0.5">
                      {mode === 'create' 
                        ? 'Define a new role for your organization' 
                        : 'Modify role details and permissions'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-6 space-y-6">

              {/* Role Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('Name', {
                      required: 'Role name is required',
                      minLength: {
                        value: 2,
                        message: 'Role name must be at least 2 characters'
                      },
                      maxLength: {
                        value: 50,
                        message: 'Role name must not exceed 50 characters'
                      },
                      pattern: {
                        value: /^[a-zA-Z0-9_-]+$/,
                        message: 'Role name can only contain letters, numbers, hyphens, and underscores'
                      }
                    })}
                    type="text"
                    className={`block w-full pl-10 pr-3 py-3 text-base rounded-lg transition-colors ${
                      errors.Name 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/10' 
                        : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 bg-gray-50 dark:bg-gray-900/50'
                    } dark:text-white`}
                    placeholder="e.g., Admin, Editor, Viewer"
                  />
                </div>
                {errors.Name && (
                  <div className="mt-2 flex items-center text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.Name.message}
                  </div>
                )}
              </div>

              {/* Description Field */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                  <span className="text-gray-400 text-xs ml-2">(Optional)</span>
                </label>
                <textarea
                  {...register('Description', {
                    maxLength: {
                      value: 500,
                      message: 'Description must not exceed 500 characters'
                    }
                  })}
                  rows={4}
                  className={`block w-full px-4 py-3 text-base rounded-lg transition-colors resize-none ${
                    errors.Description 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/10' 
                      : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 bg-gray-50 dark:bg-gray-900/50'
                  } dark:text-white`}
                  placeholder="Describe the purpose of this role and what permissions it grants..."
                />
                {errors.Description && (
                  <div className="mt-2 flex items-center text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.Description.message}
                  </div>
                )}
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {(watch('Description')?.length || 0)}/500 characters
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Info className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Role Naming Guidelines
                    </h3>
                    <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Use descriptive names that clearly indicate the role's purpose</li>
                        <li>Keep names concise but meaningful (e.g., "ContentEditor" not "CE")</li>
                        <li>Use PascalCase or snake_case for multi-word names</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {role && mode === 'edit' && role.IsSystem && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>System Role:</strong> This is a built-in system role. You can only modify its name and description.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {mode === 'create' ? 'Creating...' : 'Updating...'}
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Shield className="w-4 h-4 mr-2" />
                      {mode === 'create' ? 'Create Role' : 'Save Changes'}
                    </div>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RoleModal;