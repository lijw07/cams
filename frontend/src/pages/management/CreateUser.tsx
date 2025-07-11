import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, User, Mail, Lock, Phone, UserCheck } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { usersService } from '../../services/usersService';
import { roleService } from '../../services/roleService';

interface CreateUserFormData {
  Username: string;
  Email: string;
  Password: string;
  ConfirmPassword: string;
  FirstName: string;
  LastName: string;
  PhoneNumber?: string;
  RoleIds: number[];
  IsActive: boolean;
}

const CreateUserPage: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [roles, setRoles] = useState<Array<{ Id: number; Name: string; IsSystem: boolean }>>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    defaultValues: {
      IsActive: true,
    },
  });

  const password = watch('Password');

  React.useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const rolesData = await roleService.getAllRoles();
      setRoles(rolesData);
    } catch (error) {
      console.error('Error loading roles:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to load roles',
        type: 'error',
        source: 'CreateUser',
      });
    }
  };

  const onSubmit = async (data: CreateUserFormData) => {
    try {
      setIsLoading(true);
      
      const requestData = {
        ...data,
        RoleIds: selectedRoles,
      };

      await usersService.createUser(requestData);
      
      addNotification({
        title: 'Success',
        message: 'User created successfully',
        type: 'success',
        source: 'CreateUser',
      });
      
      navigate('/management/users');
    } catch (error: any) {
      console.error('Error creating user:', error);
      addNotification({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create user',
        type: 'error',
        source: 'CreateUser',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleToggle = (roleId: number) => {
    setSelectedRoles(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/management/users')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-6 h-6" />
              Create New User
            </h1>
            <p className="text-gray-600 dark:text-gray-300">Add a new user to the system</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">User Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  id="username"
                  type="text"
                  className={`input pl-10 ${errors.Username ? 'border-red-500' : ''}`}
                  placeholder="Enter username"
                  {...register('Username', {
                    required: 'Username is required',
                    minLength: {
                      value: 3,
                      message: 'Username must be at least 3 characters',
                    },
                    pattern: {
                      value: /^[a-zA-Z0-9_]+$/,
                      message: 'Username can only contain letters, numbers, and underscores',
                    },
                  })}
                />
              </div>
              {errors.Username && (
                <p className="mt-1 text-sm text-red-600">{errors.Username.message}</p>
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
                  id="email"
                  type="email"
                  className={`input pl-10 ${errors.Email ? 'border-red-500' : ''}`}
                  placeholder="Enter email address"
                  {...register('Email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                />
              </div>
              {errors.Email && (
                <p className="mt-1 text-sm text-red-600">{errors.Email.message}</p>
              )}
            </div>

            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                id="firstName"
                type="text"
                className={`input ${errors.FirstName ? 'border-red-500' : ''}`}
                placeholder="Enter first name"
                {...register('FirstName', {
                  required: 'First name is required',
                  minLength: {
                    value: 2,
                    message: 'First name must be at least 2 characters',
                  },
                })}
              />
              {errors.FirstName && (
                <p className="mt-1 text-sm text-red-600">{errors.FirstName.message}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                id="lastName"
                type="text"
                className={`input ${errors.LastName ? 'border-red-500' : ''}`}
                placeholder="Enter last name"
                {...register('LastName', {
                  required: 'Last name is required',
                  minLength: {
                    value: 2,
                    message: 'Last name must be at least 2 characters',
                  },
                })}
              />
              {errors.LastName && (
                <p className="mt-1 text-sm text-red-600">{errors.LastName.message}</p>
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
                  id="phoneNumber"
                  type="tel"
                  className={`input pl-10 ${errors.PhoneNumber ? 'border-red-500' : ''}`}
                  placeholder="Enter phone number"
                  {...register('PhoneNumber', {
                    pattern: {
                      value: /^[+]?[(]?[0-9]{1,3}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/,
                      message: 'Invalid phone number',
                    },
                  })}
                />
              </div>
              {errors.PhoneNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.PhoneNumber.message}</p>
              )}
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                id="isActive"
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                {...register('IsActive')}
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Active user account
              </label>
            </div>
          </div>

          {/* Password Section */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Password</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    id="password"
                    type="password"
                    className={`input pl-10 ${errors.Password ? 'border-red-500' : ''}`}
                    placeholder="Enter password"
                    {...register('Password', {
                      required: 'Password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters',
                      },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                        message: 'Password must contain uppercase, lowercase, number and special character',
                      },
                    })}
                  />
                </div>
                {errors.Password && (
                  <p className="mt-1 text-sm text-red-600">{errors.Password.message}</p>
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
                    id="confirmPassword"
                    type="password"
                    className={`input pl-10 ${errors.ConfirmPassword ? 'border-red-500' : ''}`}
                    placeholder="Confirm password"
                    {...register('ConfirmPassword', {
                      required: 'Please confirm password',
                      validate: value => value === password || 'Passwords do not match',
                    })}
                  />
                </div>
                {errors.ConfirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.ConfirmPassword.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Roles Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Assign Roles</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <div
                key={role.Id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedRoles.includes(role.Id)
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => handleRoleToggle(role.Id)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">{role.Name}</span>
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
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/management/users')}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create User
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateUserPage;