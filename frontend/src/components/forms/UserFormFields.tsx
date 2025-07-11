import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { User, Phone, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import FormField from '../common/FormField';
import Input from '../common/Input';
import Switch from '../common/Switch';

interface UserFormFieldsProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  mode: 'create' | 'edit';
  password?: string;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  showConfirmPassword?: boolean;
  onToggleConfirmPassword?: () => void;
  isActive?: boolean;
  onActiveChange?: (value: boolean) => void;
}

const UserFormFields: React.FC<UserFormFieldsProps> = ({
  register,
  errors,
  mode,
  password,
  showPassword = false,
  onTogglePassword,
  showConfirmPassword = false,
  onToggleConfirmPassword,
  isActive = true,
  onActiveChange
}) => {
  const getErrorMessage = (error: any): string | undefined => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    return undefined;
  };
  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
          <User className="w-5 h-5 mr-2" />
          User Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Username"
            error={getErrorMessage(errors.Username)}
            required
          >
            <Input
              {...register('Username', {
                required: 'Username is required',
                minLength: { value: 3, message: 'Username must be at least 3 characters' },
                maxLength: { value: 50, message: 'Username cannot exceed 50 characters' },
                pattern: {
                  value: /^[a-zA-Z0-9._-]+$/,
                  message: 'Username can only contain letters, numbers, dots, underscores, and hyphens'
                }
              })}
              placeholder="Enter username"
            />
          </FormField>

          <FormField
            label="Email"
            error={getErrorMessage(errors.Email)}
            required
          >
            <Input
              {...register('Email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              type="email"
              placeholder="Enter email address"
            />
          </FormField>

          <FormField
            label="First Name"
            error={getErrorMessage(errors.FirstName)}
          >
            <Input
              {...register('FirstName', {
                maxLength: { value: 50, message: 'First name cannot exceed 50 characters' }
              })}
              placeholder="Enter first name"
            />
          </FormField>

          <FormField
            label="Last Name"
            error={getErrorMessage(errors.LastName)}
          >
            <Input
              {...register('LastName', {
                maxLength: { value: 50, message: 'Last name cannot exceed 50 characters' }
              })}
              placeholder="Enter last name"
            />
          </FormField>

          <FormField
            label="Phone Number"
            error={getErrorMessage(errors.PhoneNumber)}
            className="md:col-span-2"
          >
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                {...register('PhoneNumber', {
                  pattern: {
                    value: /^\+?[1-9]\d{1,14}$/,
                    message: 'Invalid phone number format'
                  }
                })}
                placeholder="Enter phone number"
                className="pl-10"
              />
            </div>
          </FormField>
        </div>
      </div>

      {/* Password Fields (Create Mode Only) */}
      {mode === 'create' && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <Lock className="w-5 h-5 mr-2" />
            Security
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Password"
              error={getErrorMessage(errors.Password)}
              required
            >
              <div className="relative">
                <Input
                  {...register('Password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                      message: 'Password must contain uppercase, lowercase, number, and special character'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                />
                {onTogglePassword && (
                  <button
                    type="button"
                    onClick={onTogglePassword}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </FormField>

            <FormField
              label="Confirm Password"
              error={getErrorMessage(errors.ConfirmPassword)}
              required
            >
              <div className="relative">
                <Input
                  {...register('ConfirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) => value === password || 'Passwords do not match'
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                />
                {onToggleConfirmPassword && (
                  <button
                    type="button"
                    onClick={onToggleConfirmPassword}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </FormField>
          </div>

          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Password Requirements:</p>
                <ul className="space-y-1 text-xs">
                  <li>• At least 8 characters long</li>
                  <li>• Contains uppercase and lowercase letters</li>
                  <li>• Contains at least one number</li>
                  <li>• Contains at least one special character (@$!%*?&)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Status */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Account Status
        </h3>
        
        <FormField
          label="Active User"
          error={getErrorMessage(errors.IsActive)}
        >
          <Switch
            {...register('IsActive')}
            checked={isActive}
            onChange={onActiveChange || (() => {})}
            label={isActive ? 'Account is active' : 'Account is inactive'}
          />
        </FormField>
      </div>
    </div>
  );
};

export default UserFormFields;