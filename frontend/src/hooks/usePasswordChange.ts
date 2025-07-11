import React, { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { profileService } from '../services/profileService';

interface PasswordForm {
  CurrentPassword: string;
  NewPassword: string;
  ConfirmNewPassword: string;
}

interface ShowPasswords {
  current: boolean;
  new: boolean;
  confirm: boolean;
}

export const usePasswordChange = () => {
  const { addNotification } = useNotifications();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    CurrentPassword: '',
    NewPassword: '',
    ConfirmNewPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState<ShowPasswords>({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

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
      let errorMessage = 'Failed to change password';
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        if (typeof errors === 'object') {
          const errorMessages: string[] = [];
          for (const [field, messages] of Object.entries(errors)) {
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

  return {
    showPasswordModal,
    setShowPasswordModal,
    passwordForm,
    showPasswords,
    passwordLoading,
    handlePasswordChange,
    togglePasswordVisibility,
    validatePassword,
    handlePasswordSubmit,
    handleClosePasswordModal
  };
};