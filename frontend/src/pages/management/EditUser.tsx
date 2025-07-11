import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, User, Mail, Phone, Shield, Power, Trash2 } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { usersService } from '../../services/usersService';
import { roleService } from '../../services/roleService';

interface EditUserFormData {
  Username: string;
  Email: string;
  FirstName?: string;
  LastName?: string;
  PhoneNumber?: string;
  IsActive: boolean;
}

const EditUserPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { addNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [roles, setRoles] = useState<Array<{ Id: number; Name: string; IsSystem: boolean }>>([]);
  const [userRoles, setUserRoles] = useState<number[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditUserFormData>();

  useEffect(() => {
    if (id) {
      loadUser();
      loadRoles();
    }
  }, [id]);

  const loadUser = async () => {
    try {
      const userData = await usersService.getUser(parseInt(id!));
      setUser(userData);
      const roleIds = userData.Roles.map((r: any) => r.Id);
      setUserRoles(roleIds);
      setSelectedRoles(roleIds);
      
      reset({
        Username: userData.Username,
        Email: userData.Email,
        FirstName: userData.FirstName || '',
        LastName: userData.LastName || '',
        PhoneNumber: userData.PhoneNumber || '',
        IsActive: userData.IsActive,
      });
    } catch (error) {
      console.error('Error loading user:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to load user',
        type: 'error',
        source: 'EditUser',
      });
      navigate('/management/users');
    }
  };

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
        source: 'EditUser',
      });
    }
  };

  const onSubmit = async (data: EditUserFormData) => {
    try {
      setIsLoading(true);
      
      // Include the Id and Username in the request data as backend expects it
      // Username is disabled in the form so it's not included in data
      // Convert empty strings to null for optional fields
      const updateData = {
        ...data,
        Username: user.Username, // Add the username from the user state
        Id: parseInt(id!),
        FirstName: data.FirstName?.trim() || null,
        LastName: data.LastName?.trim() || null,
        PhoneNumber: data.PhoneNumber?.trim() || null
      };
      
      console.log('Sending updateData:', updateData);
      await usersService.updateUser(parseInt(id!), updateData as any);
      
      // Update roles if changed
      if (JSON.stringify(selectedRoles.sort()) !== JSON.stringify(userRoles.sort())) {
        await usersService.updateUserRoles(parseInt(id!), selectedRoles);
      }
      
      addNotification({
        title: 'Success',
        message: 'User updated successfully',
        type: 'success',
        source: 'EditUser',
      });
      
      navigate('/management/users');
    } catch (error: any) {
      console.error('Error updating user:', error);
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const errorMessages = Object.entries(validationErrors)
          .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
          .join('\n');
        
        addNotification({
          title: 'Validation Error',
          message: errorMessages || 'Please check the form for errors',
          type: 'error',
          source: 'EditUser',
        });
      } else {
        addNotification({
          title: 'Error',
          message: error.response?.data?.message || 'Failed to update user',
          type: 'error',
          source: 'EditUser',
        });
      }
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

  const handleToggleStatus = async () => {
    try {
      await usersService.toggleUserStatus(parseInt(id!), !user.IsActive);
      addNotification({
        title: 'Success',
        message: `User ${user.IsActive ? 'deactivated' : 'activated'} successfully`,
        type: 'success',
        source: 'EditUser',
      });
      loadUser();
    } catch (error) {
      console.error('Error toggling user status:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to update user status',
        type: 'error',
        source: 'EditUser',
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      await usersService.deleteUser(parseInt(id!));
      addNotification({
        title: 'Success',
        message: 'User deleted successfully',
        type: 'success',
        source: 'EditUser',
      });
      navigate('/management/users');
    } catch (error) {
      console.error('Error deleting user:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to delete user',
        type: 'error',
        source: 'EditUser',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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
              <User className="w-6 h-6" />
              Edit User
            </h1>
            <p className="text-gray-600 dark:text-gray-300">Update user information and roles</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleStatus}
            className={`btn ${user.IsActive ? 'btn-secondary' : 'btn-success'}`}
          >
            <Power className="w-4 h-4 mr-2" />
            {user.IsActive ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={handleDeleteUser}
            className="btn btn-error"
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
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
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  id="username"
                  type="text"
                  className="input pl-10 bg-gray-50 cursor-not-allowed"
                  {...register('Username')}
                  disabled
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Username cannot be changed</p>
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
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                className={`input ${errors.FirstName ? 'border-red-500' : ''}`}
                placeholder="Enter first name"
                {...register('FirstName', {
                  minLength: {
                    value: 2,
                    message: 'First name must be at least 2 characters',
                  },
                  maxLength: {
                    value: 50,
                    message: 'First name must not exceed 50 characters',
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
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                className={`input ${errors.LastName ? 'border-red-500' : ''}`}
                placeholder="Enter last name"
                {...register('LastName', {
                  minLength: {
                    value: 2,
                    message: 'Last name must be at least 2 characters',
                  },
                  maxLength: {
                    value: 50,
                    message: 'Last name must not exceed 50 characters',
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

          {/* User Stats */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium">{new Date(user.CreatedAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Login</p>
                <p className="font-medium">
                  {user.LastLoginAt ? new Date(user.LastLoginAt).toLocaleDateString() : 'Never'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Applications</p>
                <p className="font-medium">{user.ApplicationCount || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Connections</p>
                <p className="font-medium">{user.DatabaseConnectionCount || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Roles Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5" />
              User Roles
            </h2>
          </div>
          
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
            disabled={isLoading || (!isDirty && JSON.stringify(selectedRoles.sort()) === JSON.stringify(userRoles.sort()))}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditUserPage;