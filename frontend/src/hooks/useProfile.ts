import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { profileService } from '../services/profileService';

interface ProfileFormData {
  FirstName: string;
  LastName: string;
  PhoneNumber: string;
}

export const useProfile = () => {
  const { user, refreshUserProfile } = useAuth();
  const { addNotification } = useNotifications();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    FirstName: '',
    LastName: '',
    PhoneNumber: ''
  });
  const [originalData, setOriginalData] = useState<ProfileFormData>({
    FirstName: '',
    LastName: '',
    PhoneNumber: ''
  });

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
    if (!phone) return true;
    const phonePattern = /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;
    return phonePattern.test(phone);
  };

  return {
    user,
    isEditing,
    isLoading,
    formData,
    handleEditClick,
    handleCancelClick,
    handleInputChange,
    handleSaveClick,
    hasChanges,
    isValidPhoneNumber
  };
};