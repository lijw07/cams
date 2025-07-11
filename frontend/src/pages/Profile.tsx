import React, { useState, useEffect } from 'react';
import { User, Edit, Save, X, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { profileService } from '../services/profileService';

const Profile: React.FC = () => {
  const { user, refreshUserProfile } = useAuth();
  const { addNotification } = useNotifications();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    FirstName: '',
    LastName: '',
    PhoneNumber: ''
  });
  const [originalData, setOriginalData] = useState({
    FirstName: '',
    LastName: '',
    PhoneNumber: ''
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    CurrentPassword: '',
    NewPassword: '',
    ConfirmNewPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      const data = {
        FirstName: user.FirstName || '',
        LastName: user.LastName || '',
        PhoneNumber: user.PhoneNumber || ''
      };
      setFormData(data);
      setOriginalData(data);
    }
  }, [user]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setFormData(originalData);
    setIsEditing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveClick = async () => {
    setIsLoading(true);
    try {
      // Clean up the data - convert empty strings to null for optional fields
      const cleanedData = {
        FirstName: formData.FirstName || null,
        LastName: formData.LastName || null,
        PhoneNumber: formData.PhoneNumber || null
      };
      
      await profileService.updateProfile(cleanedData);
      setOriginalData(formData);
      setIsEditing(false);
      await refreshUserProfile();
      addNotification({
        title: 'Profile Updated',
        message: 'Your profile has been updated successfully',
        type: 'success',
        source: 'Profile',
        actionUrl: '/profile'
      });
    } catch (error: any) {
      console.error('Profile update error:', error.response?.data);
      addNotification({
        title: 'Update Failed',
        message: error.response?.data?.message || 'Failed to update profile',
        type: 'error',
        source: 'Profile'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  };

  const isValidPhoneNumber = (phone: string): boolean => {
    if (!phone) return true; // Empty is valid
    // Basic phone number validation - matches backend pattern
    const phonePattern = /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;
    return phonePattern.test(phone);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[@$!%*?&]/.test(password);
    
    return {
      minLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
      isValid: minLength && hasUpper && hasLower && hasNumber && hasSpecial
    };
  };

  const handlePasswordSubmit = async () => {
    if (passwordForm.NewPassword !== passwordForm.ConfirmNewPassword) {
      addNotification({
        title: 'Password Mismatch',
        message: 'New passwords do not match',
        type: 'error',
        source: 'Profile'
      });
      return;
    }

    const validation = validatePassword(passwordForm.NewPassword);
    if (!validation.isValid) {
      addNotification({
        title: 'Invalid Password',
        message: 'Password does not meet requirements',
        type: 'error',
        source: 'Profile'
      });
      return;
    }

    setPasswordLoading(true);
    try {
      console.log('Sending password change request with:', {
        CurrentPassword: passwordForm.CurrentPassword ? '[REDACTED]' : 'empty',
        NewPassword: passwordForm.NewPassword ? '[REDACTED]' : 'empty',
        ConfirmNewPassword: passwordForm.ConfirmNewPassword ? '[REDACTED]' : 'empty'
      });
      await profileService.changePassword(passwordForm);
      setPasswordForm({
        CurrentPassword: '',
        NewPassword: '',
        ConfirmNewPassword: ''
      });
      setShowPasswordModal(false);
      addNotification({
        title: 'Password Changed',
        message: 'Your password has been changed successfully',
        type: 'success',
        source: 'Profile',
        actionUrl: '/profile'
      });
    } catch (error: any) {
      console.error('Password change error:', error.response?.data);
      console.error('Full error object:', error);
      // Handle validation errors
      let errorMessage = 'Failed to change password';
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        console.error('Validation errors:', errors);
        // Check if it's the ASP.NET Core validation format
        if (typeof errors === 'object') {
          const errorMessages: string[] = [];
          for (const [field, messages] of Object.entries(errors)) {
            console.error(`Field '${field}' has errors:`, messages);
            if (Array.isArray(messages)) {
              errorMessages.push(`${field}: ${messages.join(', ')}`);
            } else if (typeof messages === 'string') {
              errorMessages.push(`${field}: ${messages}`);
            }
          }
          errorMessage = errorMessages.length > 0 ? errorMessages.join('; ') : 'Validation failed';
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data) {
        errorMessage = typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data);
      }
      
      addNotification({
        title: 'Password Change Failed',
        message: errorMessage,
        type: 'error',
        source: 'Profile'
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleClosePasswordModal = () => {
    setPasswordForm({
      CurrentPassword: '',
      NewPassword: '',
      ConfirmNewPassword: ''
    });
    setShowPasswords({
      current: false,
      new: false,
      confirm: false
    });
    setShowPasswordModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your account information and preferences</p>
        </div>
        {!isEditing ? (
          <button 
            onClick={handleEditClick}
            className="btn btn-primary"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button 
              onClick={handleCancelClick}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </button>
            <button 
              onClick={handleSaveClick}
              className="btn btn-primary"
              disabled={isLoading || !hasChanges() || !isValidPhoneNumber(formData.PhoneNumber)}
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center space-x-6 mb-6">
          <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {user?.FirstName && user?.LastName 
                ? `${user.FirstName} ${user.LastName}`
                : user?.Username || 'User'
              }
            </h2>
            <p className="text-gray-600 dark:text-gray-300">{user?.Email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <div className="input bg-gray-50">{user?.Username}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="input bg-gray-50">{user?.Email}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            {isEditing ? (
              <input
                type="text"
                name="FirstName"
                value={formData.FirstName}
                onChange={handleInputChange}
                className="input"
                placeholder="Enter your first name"
                maxLength={50}
              />
            ) : (
              <div className="input bg-gray-50">{user?.FirstName || 'Not set'}</div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            {isEditing ? (
              <input
                type="text"
                name="LastName"
                value={formData.LastName}
                onChange={handleInputChange}
                className="input"
                placeholder="Enter your last name"
                maxLength={50}
              />
            ) : (
              <div className="input bg-gray-50">{user?.LastName || 'Not set'}</div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            {isEditing ? (
              <div>
                <input
                  type="tel"
                  name="PhoneNumber"
                  value={formData.PhoneNumber}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter your phone number (e.g., +1-234-567-8900)"
                  maxLength={15}
                />
                {formData.PhoneNumber && !isValidPhoneNumber(formData.PhoneNumber) && (
                  <p className="mt-1 text-xs text-red-600">Please enter a valid phone number</p>
                )}
              </div>
            ) : (
              <div className="input bg-gray-50">{user?.PhoneNumber || 'Not set'}</div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="flex items-center space-x-2">
              <div className="input bg-gray-50 flex-1">••••••••••••</div>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 border border-primary-600 hover:border-primary-700 rounded-md transition-colors"
              >
                Change
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Member Since
            </label>
            <div className="input bg-gray-50">
              {user?.CreatedAt ? new Date(user.CreatedAt).toLocaleDateString() : 'Unknown'}
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Username and email cannot be changed from this page. 
              Use the "Change" button next to the password field to update your password.
            </p>
          </div>
        )}
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75" onClick={handleClosePasswordModal}></div>

            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Change Password</h3>
                <button
                  onClick={handleClosePasswordModal}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      name="CurrentPassword"
                      value={passwordForm.CurrentPassword}
                      onChange={handlePasswordChange}
                      className="input pr-10"
                      placeholder="Enter your current password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      name="NewPassword"
                      value={passwordForm.NewPassword}
                      onChange={handlePasswordChange}
                      className="input pr-10"
                      placeholder="Enter your new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {/* Password Requirements */}
                  {passwordForm.NewPassword && (
                    <div className="mt-2 space-y-1">
                      {(() => {
                        const validation = validatePassword(passwordForm.NewPassword);
                        return (
                          <div className="text-xs space-y-1">
                            <div className={`flex items-center ${validation.minLength ? 'text-green-600' : 'text-red-600'}`}>
                              <span className="mr-2">{validation.minLength ? '✓' : '✗'}</span>
                              At least 8 characters
                            </div>
                            <div className={`flex items-center ${validation.hasUpper ? 'text-green-600' : 'text-red-600'}`}>
                              <span className="mr-2">{validation.hasUpper ? '✓' : '✗'}</span>
                              One uppercase letter
                            </div>
                            <div className={`flex items-center ${validation.hasLower ? 'text-green-600' : 'text-red-600'}`}>
                              <span className="mr-2">{validation.hasLower ? '✓' : '✗'}</span>
                              One lowercase letter
                            </div>
                            <div className={`flex items-center ${validation.hasNumber ? 'text-green-600' : 'text-red-600'}`}>
                              <span className="mr-2">{validation.hasNumber ? '✓' : '✗'}</span>
                              One number
                            </div>
                            <div className={`flex items-center ${validation.hasSpecial ? 'text-green-600' : 'text-red-600'}`}>
                              <span className="mr-2">{validation.hasSpecial ? '✓' : '✗'}</span>
                              One special character (@$!%*?&)
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      name="ConfirmNewPassword"
                      value={passwordForm.ConfirmNewPassword}
                      onChange={handlePasswordChange}
                      className="input pr-10"
                      placeholder="Confirm your new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordForm.ConfirmNewPassword && passwordForm.NewPassword !== passwordForm.ConfirmNewPassword && (
                    <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={handleClosePasswordModal}
                  className="btn btn-secondary"
                  disabled={passwordLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  className="btn btn-primary"
                  disabled={
                    passwordLoading ||
                    !passwordForm.CurrentPassword ||
                    !passwordForm.NewPassword ||
                    !passwordForm.ConfirmNewPassword ||
                    passwordForm.NewPassword !== passwordForm.ConfirmNewPassword ||
                    !validatePassword(passwordForm.NewPassword).isValid
                  }
                >
                  {passwordLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;