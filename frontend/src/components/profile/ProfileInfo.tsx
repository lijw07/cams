import React, { useState, useEffect } from 'react';
import { User, Edit, Save, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Button, Input, FormField, Card, CardHeader, CardTitle, CardContent } from '../common';
import { profileService } from '../../services/profileService';

const ProfileInfo: React.FC = () => {
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

  const handleCancelEdit = () => {
    setFormData(originalData);
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      await profileService.updateProfile({
        FirstName: formData.FirstName,
        LastName: formData.LastName,
        PhoneNumber: formData.PhoneNumber
      });

      await refreshUserProfile();
      setOriginalData(formData);
      setIsEditing(false);
      
      addNotification({
        title: 'Profile Updated',
        message: 'Your profile has been updated successfully',
        type: 'success',
        source: 'Profile'
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      addNotification({
        title: 'Update Failed',
        message: 'Failed to update profile. Please try again.',
        type: 'error',
        source: 'Profile'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Profile Information
          </CardTitle>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditClick}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <FormField label="Username">
          <Input
            value={user.Username}
            disabled
            className="bg-secondary-50 dark:bg-secondary-900"
          />
        </FormField>

        <FormField label="Email">
          <Input
            value={user.Email}
            disabled
            className="bg-secondary-50 dark:bg-secondary-900"
          />
        </FormField>

        <FormField label="First Name">
          <Input
            value={formData.FirstName}
            disabled={!isEditing}
            onChange={(e) => handleInputChange('FirstName', e.target.value)}
            placeholder="Enter your first name"
          />
        </FormField>

        <FormField label="Last Name">
          <Input
            value={formData.LastName}
            disabled={!isEditing}
            onChange={(e) => handleInputChange('LastName', e.target.value)}
            placeholder="Enter your last name"
          />
        </FormField>

        <FormField label="Phone Number">
          <Input
            value={formData.PhoneNumber}
            disabled={!isEditing}
            onChange={(e) => handleInputChange('PhoneNumber', e.target.value)}
            placeholder="Enter your phone number"
          />
        </FormField>

        {isEditing && (
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancelEdit}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={isLoading}
              loading={isLoading}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileInfo;