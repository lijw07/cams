import React, { useState } from 'react';

import { Lock, Eye, EyeOff } from 'lucide-react';

import { useNotifications } from '../../contexts/NotificationContext';
import { profileService } from '../../services/profileService';
import { Button, Input, FormField, Card, CardHeader, CardTitle, CardContent } from '../common';

const PasswordChange: React.FC = () => {
  const { addNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (!formData.confirmNewPassword) {
      newErrors.confirmNewPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmNewPassword) {
      newErrors.confirmNewPassword = 'Passwords do not match';
    }

    if (formData.currentPassword && formData.newPassword && 
        formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      await profileService.changePassword({
        CurrentPassword: formData.currentPassword,
        NewPassword: formData.newPassword,
        ConfirmNewPassword: formData.confirmNewPassword
      });

      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });

      addNotification({
        title: 'Password Changed',
        message: 'Your password has been changed successfully',
        type: 'success',
        source: 'Profile'
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      addNotification({
        title: 'Password Change Failed',
        message: error.message || 'Failed to change password. Please try again.',
        type: 'error',
        source: 'Profile'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lock className="w-5 h-5 mr-2" />
          Change Password
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <FormField 
          label="Current Password" 
          required 
          error={errors.currentPassword}
        >
          <div className="relative">
            <Input
              type={showPasswords.current ? 'text' : 'password'}
              value={formData.currentPassword}
              onChange={(e) => handleInputChange('currentPassword', e.target.value)}
              placeholder="Enter your current password"
              error={!!errors.currentPassword}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
              onClick={() => togglePasswordVisibility('current')}
            >
              {showPasswords.current ? (
                <EyeOff className="w-4 h-4 text-secondary-400" />
              ) : (
                <Eye className="w-4 h-4 text-secondary-400" />
              )}
            </button>
          </div>
        </FormField>

        <FormField 
          label="New Password" 
          required 
          error={errors.newPassword}
          helpText="Password must be at least 6 characters"
        >
          <div className="relative">
            <Input
              type={showPasswords.new ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={(e) => handleInputChange('newPassword', e.target.value)}
              placeholder="Enter your new password"
              error={!!errors.newPassword}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
              onClick={() => togglePasswordVisibility('new')}
            >
              {showPasswords.new ? (
                <EyeOff className="w-4 h-4 text-secondary-400" />
              ) : (
                <Eye className="w-4 h-4 text-secondary-400" />
              )}
            </button>
          </div>
        </FormField>

        <FormField 
          label="Confirm New Password" 
          required 
          error={errors.confirmNewPassword}
        >
          <div className="relative">
            <Input
              type={showPasswords.confirm ? 'text' : 'password'}
              value={formData.confirmNewPassword}
              onChange={(e) => handleInputChange('confirmNewPassword', e.target.value)}
              placeholder="Confirm your new password"
              error={!!errors.confirmNewPassword}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
              onClick={() => togglePasswordVisibility('confirm')}
            >
              {showPasswords.confirm ? (
                <EyeOff className="w-4 h-4 text-secondary-400" />
              ) : (
                <Eye className="w-4 h-4 text-secondary-400" />
              )}
            </button>
          </div>
        </FormField>

        <div className="flex justify-end pt-4">
          <Button
            onClick={handleChangePassword}
            disabled={isLoading}
            loading={isLoading}
          >
            Change Password
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PasswordChange;