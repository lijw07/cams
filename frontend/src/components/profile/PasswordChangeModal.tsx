import React from 'react';

import { X, Eye, EyeOff, Shield } from 'lucide-react';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  passwordForm: {
    CurrentPassword: string;
    NewPassword: string;
    ConfirmNewPassword: string;
  };
  showPasswords: {
    current: boolean;
    new: boolean;
    confirm: boolean;
  };
  passwordLoading: boolean;
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePasswordVisibility: (field: 'current' | 'new' | 'confirm') => void;
  onPasswordSubmit: () => void;
  validatePassword: (password: string) => {
    minLength: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
    isValid: boolean;
  };
}

const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({
  isOpen,
  onClose,
  passwordForm,
  showPasswords,
  passwordLoading,
  onPasswordChange,
  onTogglePasswordVisibility,
  onPasswordSubmit,
  validatePassword
}) => {
  if (!isOpen) return null;

  const validation = validatePassword(passwordForm.NewPassword);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-secondary-800 shadow-xl rounded-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Shield className="w-6 h-6 text-primary-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Change Password</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-secondary-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? "text" : "password"}
                  name="CurrentPassword"
                  value={passwordForm.CurrentPassword}
                  onChange={onPasswordChange}
                  className="block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-secondary-700 text-gray-900 dark:text-white"
                  placeholder="Enter your current password"
                  required
                />
                <button
                  type="button"
                  onClick={() => onTogglePasswordVisibility('current')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? "text" : "password"}
                  name="NewPassword"
                  value={passwordForm.NewPassword}
                  onChange={onPasswordChange}
                  className="block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-secondary-700 text-gray-900 dark:text-white"
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => onTogglePasswordVisibility('new')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  name="ConfirmNewPassword"
                  value={passwordForm.ConfirmNewPassword}
                  onChange={onPasswordChange}
                  className="block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-secondary-700 text-gray-900 dark:text-white"
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => onTogglePasswordVisibility('confirm')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            {passwordForm.NewPassword && (
              <div className="p-3 bg-gray-50 dark:bg-secondary-700 rounded-lg">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password Requirements:</p>
                <ul className="text-xs space-y-1">
                  <li className={`flex items-center ${validation.minLength ? 'text-green-600' : 'text-red-600'}`}>
                    <span className="mr-1">{validation.minLength ? '✓' : '✗'}</span>
                    At least 8 characters
                  </li>
                  <li className={`flex items-center ${validation.hasUpper ? 'text-green-600' : 'text-red-600'}`}>
                    <span className="mr-1">{validation.hasUpper ? '✓' : '✗'}</span>
                    One uppercase letter
                  </li>
                  <li className={`flex items-center ${validation.hasLower ? 'text-green-600' : 'text-red-600'}`}>
                    <span className="mr-1">{validation.hasLower ? '✓' : '✗'}</span>
                    One lowercase letter
                  </li>
                  <li className={`flex items-center ${validation.hasNumber ? 'text-green-600' : 'text-red-600'}`}>
                    <span className="mr-1">{validation.hasNumber ? '✓' : '✗'}</span>
                    One number
                  </li>
                  <li className={`flex items-center ${validation.hasSpecial ? 'text-green-600' : 'text-red-600'}`}>
                    <span className="mr-1">{validation.hasSpecial ? '✓' : '✗'}</span>
                    One special character (@$!%*?&)
                  </li>
                </ul>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-secondary-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-secondary-600"
                disabled={passwordLoading}
              >
                Cancel
              </button>
              <button
                onClick={onPasswordSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
                disabled={
                  passwordLoading || 
                  !passwordForm.CurrentPassword || 
                  !passwordForm.NewPassword || 
                  !passwordForm.ConfirmNewPassword ||
                  !validation.isValid ||
                  passwordForm.NewPassword !== passwordForm.ConfirmNewPassword
                }
              >
                {passwordLoading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordChangeModal;