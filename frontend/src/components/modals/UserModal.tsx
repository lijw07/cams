import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, User, Mail, Lock, Phone, UserCheck, Shield, AlertCircle, Info } from 'lucide-react';
import { roleService } from '../../services/roleService';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserRequest | UpdateUserRequest, roleIds: number[]) => Promise<void>;
  user?: UserWithRoles;
  mode?: 'create' | 'edit';
}

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
  Id: number;
  Username: string;
  Email: string;
  FirstName?: string;
  LastName?: string;
  PhoneNumber?: string;
  IsActive: boolean;
}

interface UserWithRoles {
  Id: number;
  Username: string;
  Email: string;
  FirstName?: string;
  LastName?: string;
  PhoneNumber?: string;
  IsActive: boolean;
  CreatedAt: string;
  LastLoginAt?: string;
  ApplicationCount: number;
  DatabaseConnectionCount: number;
  Roles: Array<{
    Id: number;
    Name: string;
    Description?: string;
    IsActive: boolean;
    CreatedAt: string;
    UpdatedAt: string;
  }>;
}

interface Role {
  Id: number;
  Name: string;
  IsSystem: boolean;
}

const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  user,
  mode = 'create'
}) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<any>({
    defaultValues: {
      Username: '',
      Email: '',
      FirstName: '',
      LastName: '',
      PhoneNumber: '',
      IsActive: true,
      ...(mode === 'create' && {
        Password: '',
        ConfirmPassword: ''
      })
    }
  });

  const password = watch('Password');

  useEffect(() => {
    if (isOpen) {
      loadRoles();
      
      if (user && mode === 'edit') {
        reset({
          Id: user.Id,
          Username: user.Username,
          Email: user.Email,
          FirstName: user.FirstName || '',
          LastName: user.LastName || '',
          PhoneNumber: user.PhoneNumber || '',
          IsActive: user.IsActive
        });
        setSelectedRoles(user.Roles.map(r => r.Id));
      } else {
        reset({
          Username: '',
          Email: '',
          FirstName: '',
          LastName: '',
          PhoneNumber: '',
          IsActive: true,
          ...(mode === 'create' && {
            Password: '',
            ConfirmPassword: ''
          })
        });
        setSelectedRoles([]);
      }
    }
  }, [user, mode, reset, isOpen]);

  const loadRoles = async () => {
    try {
      setIsLoadingRoles(true);
      const rolesData = await roleService.getAllRoles();
      setRoles(rolesData);
    } catch (error) {
      console.error('Error loading roles:', error);
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      await onSubmit(data, selectedRoles);
      reset();
      setSelectedRoles([]);
      onClose();
    } catch (error) {
      console.error('Error submitting user:', error);
    }
  };

  const handleRoleToggle = (roleId: number) => {
    setSelectedRoles(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full dark:bg-gray-800">
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg">
                    <UserCheck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {mode === 'create' ? 'Create New User' : `Edit User: ${user?.Username}`}
                    </h3>
                    <p className="text-sm text-primary-100 mt-0.5">
                      {mode === 'create' 
                        ? 'Add a new user to the system' 
                        : 'Update user information and roles'}
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
            <div className="px-6 py-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              
              {/* User Information Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Username */}
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        {...register('Username', {
                          required: 'Username is required',
                          minLength: {
                            value: 3,
                            message: 'Username must be at least 3 characters'
                          },
                          pattern: {
                            value: /^[a-zA-Z0-9_]+$/,
                            message: 'Username can only contain letters, numbers, and underscores'
                          }
                        })}
                        type="text"
                        className={`block w-full pl-10 pr-3 py-2 text-sm rounded-lg transition-colors ${
                          mode === 'edit' ? 'bg-gray-50 cursor-not-allowed' : ''
                        } ${
                          errors.Username 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/10' 
                            : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500'
                        } dark:text-white`}
                        placeholder="Enter username"
                        disabled={mode === 'edit'}
                      />
                    </div>
                    {errors.Username && (
                      <div className="mt-1 flex items-center text-xs text-red-600">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.Username.message}
                      </div>
                    )}
                    {mode === 'edit' && (
                      <p className="mt-1 text-xs text-gray-500">Username cannot be changed</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        {...register('Email', {
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address'
                          }
                        })}
                        type="email"
                        className={`block w-full pl-10 pr-3 py-2 text-sm rounded-lg transition-colors ${
                          errors.Email 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/10' 
                            : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500'
                        } dark:text-white`}
                        placeholder="Enter email address"
                      />
                    </div>
                    {errors.Email && (
                      <div className="mt-1 flex items-center text-xs text-red-600">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.Email.message}
                      </div>
                    )}
                  </div>

                  {/* First Name */}
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      First Name {mode === 'create' && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      {...register('FirstName', {
                        ...(mode === 'create' && { required: 'First name is required' }),
                        minLength: {
                          value: 2,
                          message: 'First name must be at least 2 characters'
                        },
                        maxLength: {
                          value: 50,
                          message: 'First name must not exceed 50 characters'
                        }
                      })}
                      type="text"
                      className={`block w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                        errors.FirstName 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/10' 
                          : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500'
                      } dark:text-white`}
                      placeholder="Enter first name"
                    />
                    {errors.FirstName && (
                      <div className="mt-1 flex items-center text-xs text-red-600">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.FirstName.message}
                      </div>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Last Name {mode === 'create' && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      {...register('LastName', {
                        ...(mode === 'create' && { required: 'Last name is required' }),
                        minLength: {
                          value: 2,
                          message: 'Last name must be at least 2 characters'
                        },
                        maxLength: {
                          value: 50,
                          message: 'Last name must not exceed 50 characters'
                        }
                      })}
                      type="text"
                      className={`block w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                        errors.LastName 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/10' 
                          : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500'
                      } dark:text-white`}
                      placeholder="Enter last name"
                    />
                    {errors.LastName && (
                      <div className="mt-1 flex items-center text-xs text-red-600">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.LastName.message}
                      </div>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        {...register('PhoneNumber', {
                          pattern: {
                            value: /^[+]?[(]?[0-9]{1,3}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/,
                            message: 'Invalid phone number'
                          }
                        })}
                        type="tel"
                        className={`block w-full pl-10 pr-3 py-2 text-sm rounded-lg transition-colors ${
                          errors.PhoneNumber 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/10' 
                            : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500'
                        } dark:text-white`}
                        placeholder="Enter phone number"
                      />
                    </div>
                    {errors.PhoneNumber && (
                      <div className="mt-1 flex items-center text-xs text-red-600">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.PhoneNumber.message}
                      </div>
                    )}
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center">
                    <input
                      {...register('IsActive')}
                      type="checkbox"
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Active user account
                    </label>
                  </div>
                </div>
              </div>

              {/* Password Section (Create Mode Only) */}
              {mode === 'create' && (
                <div>
                  <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Password</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Password */}
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          {...register('Password', {
                            required: 'Password is required',
                            minLength: {
                              value: 8,
                              message: 'Password must be at least 8 characters'
                            },
                            pattern: {
                              value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                              message: 'Password must contain uppercase, lowercase, number and special character'
                            }
                          })}
                          type="password"
                          className={`block w-full pl-10 pr-3 py-2 text-sm rounded-lg transition-colors ${
                            errors.Password 
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/10' 
                              : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500'
                          } dark:text-white`}
                          placeholder="Enter password"
                        />
                      </div>
                      {errors.Password && (
                        <div className="mt-1 flex items-center text-xs text-red-600">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {errors.Password.message}
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          {...register('ConfirmPassword', {
                            required: 'Please confirm password',
                            validate: value => value === password || 'Passwords do not match'
                          })}
                          type="password"
                          className={`block w-full pl-10 pr-3 py-2 text-sm rounded-lg transition-colors ${
                            errors.ConfirmPassword 
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/10' 
                              : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500'
                          } dark:text-white`}
                          placeholder="Confirm password"
                        />
                      </div>
                      {errors.ConfirmPassword && (
                        <div className="mt-1 flex items-center text-xs text-red-600">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {errors.ConfirmPassword.message}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* User Stats (Edit Mode Only) */}
              {mode === 'edit' && user && (
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">User Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
                      <p className="text-sm font-medium">{new Date(user.CreatedAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Last Login</p>
                      <p className="text-sm font-medium">
                        {user.LastLoginAt ? new Date(user.LastLoginAt).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Applications</p>
                      <p className="text-sm font-medium">{user.ApplicationCount || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Connections</p>
                      <p className="text-sm font-medium">{user.DatabaseConnectionCount || 0}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Roles Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Assign Roles
                  </h2>
                  {selectedRoles.length > 0 && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedRoles.length} role(s) selected
                    </span>
                  )}
                </div>
                
                {isLoadingRoles ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">Loading roles...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {roles.map((role) => (
                      <div
                        key={role.Id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedRoles.includes(role.Id)
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        onClick={() => handleRoleToggle(role.Id)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{role.Name}</span>
                          <input
                            type="checkbox"
                            checked={selectedRoles.includes(role.Id)}
                            onChange={() => {}}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                        </div>
                        {role.IsSystem && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">System Role</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Info className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      User Guidelines
                    </h3>
                    <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Email address must be unique in the system</li>
                        <li>Username cannot be changed after creation</li>
                        <li>At least one role should be assigned for proper access control</li>
                        {mode === 'create' && <li>Password must meet complexity requirements</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
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
                      <UserCheck className="w-4 h-4 mr-2" />
                      {mode === 'create' ? 'Create User' : 'Save Changes'}
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

export default UserModal;