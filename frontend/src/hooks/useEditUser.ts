import { useState, useEffect } from 'react';

import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { useNotifications } from '../contexts/NotificationContext';
import { roleService } from '../services/roleService';
import { usersService } from '../services/usersService';

interface EditUserFormData {
  Username: string;
  Email: string;
  FirstName?: string;
  LastName?: string;
  PhoneNumber?: string;
  IsActive: boolean;
}

export const useEditUser = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { addNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [roles, setRoles] = useState<Array<{ Id: string; Name: string; IsSystem: boolean }>>([]);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const form = useForm<EditUserFormData>();

  useEffect(() => {
    if (id) {
      loadUser();
      loadRoles();
    }
  }, [id]);

  const loadUser = async () => {
    try {
      const userData = await usersService.getUser(id!);
      setUser(userData);
      const roleIds = userData.Roles.map((r: any) => r.Id.toString());
      setUserRoles(roleIds);
      setSelectedRoles(roleIds);
      
      form.reset({
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
      
      const updateData = {
        ...data,
        Username: user.Username,
        Id: parseInt(id!),
        FirstName: data.FirstName?.trim() || null,
        LastName: data.LastName?.trim() || null,
        PhoneNumber: data.PhoneNumber?.trim() || null
      };
      
      await usersService.updateUser(id!, updateData as any);
      
      // Update roles if changed
      if (JSON.stringify(selectedRoles.sort()) !== JSON.stringify(userRoles.sort())) {
        await usersService.updateUserRoles(id!, selectedRoles);
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

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleToggleStatus = async () => {
    try {
      await usersService.toggleUserStatus(id!, !user.IsActive);
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
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      await usersService.deleteUser(id!);
      
      addNotification({
        title: 'Success',
        message: 'User deleted successfully',
        type: 'success',
        source: 'EditUser',
      });
      
      navigate('/management/users');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      addNotification({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to delete user',
        type: 'error',
        source: 'EditUser',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const hasUnsavedChanges = () => {
    return form.formState.isDirty || JSON.stringify(selectedRoles.sort()) !== JSON.stringify(userRoles.sort());
  };

  return {
    user,
    roles,
    selectedRoles,
    isLoading,
    isDeleting,
    form,
    onSubmit,
    handleRoleToggle,
    handleToggleStatus,
    handleDeleteUser,
    hasUnsavedChanges,
    navigate
  };
};