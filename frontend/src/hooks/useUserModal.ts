import { useState, useEffect } from 'react';

import { useForm } from 'react-hook-form';

import { useNotifications } from '../contexts/NotificationContext';
import { roleService, Role } from '../services/roleService';
import { UserWithRoles } from '../types/management';

interface CreateUserRequest {
  Username: string;
  Email: string;
  Password: string;
  ConfirmPassword: string;
  FirstName: string;
  LastName: string;
  PhoneNumber?: string;
  IsActive: boolean;
}

interface UpdateUserRequest {
  Id: string;
  Username: string;
  Email: string;
  FirstName?: string;
  LastName?: string;
  PhoneNumber?: string;
  IsActive: boolean;
}

interface UseUserModalProps {
  isOpen: boolean;
  user?: UserWithRoles;
  mode: 'create' | 'edit';
  onSubmit: (data: CreateUserRequest | UpdateUserRequest, roleIds: string[]) => Promise<void>;
  onClose: () => void;
}

export const useUserModal = ({ isOpen, user, mode, onSubmit, onClose }: UseUserModalProps) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const { addNotification } = useNotifications();

  const form = useForm<any>({
    defaultValues: {
      Username: '',
      Email: '',
      FirstName: '',
      LastName: '',
      PhoneNumber: '',
      IsActive: true,
      ...(mode === 'create' && {
        Password: '',
        ConfirmPassword: ''
      })
    }
  });

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = form;
  const password = watch('Password');

  const loadRoles = async () => {
    try {
      setIsLoadingRoles(true);
      const response = await roleService.getAllRoles();
      setRoles(response);
    } catch (error) {
      console.error('Error loading roles:', error);
      
      // Extract error code from the error response
      let errorCode = 'UNKNOWN_ERROR';
      let errorMessage = 'Failed to load roles';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as any).response;
        if (response?.data?.ErrorCode) {
          errorCode = response.data.ErrorCode;
        } else if (response?.status) {
          errorCode = `HTTP_${response.status}`;
        }
        
        if (response?.data?.Message) {
          errorMessage = response.data.Message;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
        errorCode = 'CLIENT_ERROR';
      }
      
      addNotification({
        title: `Failed to Load Roles (${errorCode})`,
        message: errorMessage,
        type: 'error',
        source: 'User Management',
        details: `Could not load available roles for user assignment with error code: ${errorCode}.`,
        technical: `Error Code: ${errorCode}\nError Message: ${errorMessage}\nOperation: Load Roles for User Modal`,
        suggestions: [
          'Check your internet connection',
          'Verify that you have permission to view roles',
          'Try refreshing the page',
          'Contact your system administrator if the problem persists'
        ]
      });
    } finally {
      setIsLoadingRoles(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadRoles();
      if (user) {
        reset({
          Username: user.Username,
          Email: user.Email,
          FirstName: user.FirstName || '',
          LastName: user.LastName || '',
          PhoneNumber: user.PhoneNumber || '',
          IsActive: user.IsActive
        });
        setSelectedRoles(user.Roles.map(role => role.Id.toString()));
      } else {
        reset({
          Username: '',
          Email: '',
          FirstName: '',
          LastName: '',
          PhoneNumber: '',
          IsActive: true,
          ...(mode === 'create' && {
            Password: '',
            ConfirmPassword: ''
          })
        });
        setSelectedRoles([]);
      }
    }
  }, [isOpen, user, mode, reset]);

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleId) 
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (mode === 'create') {
        await onSubmit(data as CreateUserRequest, selectedRoles);
      } else {
        await onSubmit({ ...data, Id: user!.Id } as UpdateUserRequest, selectedRoles);
      }
      
      // Success notification
      const roleNames = selectedRoles.map(roleId => 
        roles.find(role => role.Id.toString() === roleId)?.Name || 'Unknown Role'
      ).join(', ');
      
      addNotification({
        title: `User ${mode === 'create' ? 'Created' : 'Updated'} Successfully`,
        message: `${data.Username} has been ${mode === 'create' ? 'created' : 'updated'} successfully`,
        type: 'success',
        source: 'User Management',
        details: `User "${data.Username}" (${data.FirstName} ${data.LastName}) has been ${mode === 'create' ? 'created' : 'updated'} with ${selectedRoles.length} role(s): ${roleNames || 'No roles assigned'}.`,
        suggestions: [
          mode === 'create' ? 'Notify the user of their new account credentials' : 'Inform the user of any changes to their account',
          'Review user permissions and role assignments',
          'Monitor user activity in the system logs'
        ]
      });
      
      handleClose();
    } catch (error) {
      console.error('Error submitting user:', error);
      
      // Extract error code from the error response
      let errorCode = 'UNKNOWN_ERROR';
      let errorMessage = `Failed to ${mode === 'create' ? 'create' : 'update'} user`;
      
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as any).response;
        if (response?.data?.ErrorCode) {
          errorCode = response.data.ErrorCode;
        } else if (response?.status) {
          errorCode = `HTTP_${response.status}`;
        }
        
        if (response?.data?.Message) {
          errorMessage = response.data.Message;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
        errorCode = 'CLIENT_ERROR';
      }
      
      // Error notification
      addNotification({
        title: `User ${mode === 'create' ? 'Creation' : 'Update'} Failed (${errorCode})`,
        message: errorMessage,
        type: 'error',
        source: 'User Management',
        details: `Failed to ${mode === 'create' ? 'create' : 'update'} user "${data.Username}" with error code: ${errorCode}.`,
        technical: `Error Code: ${errorCode}\nError Message: ${errorMessage}\nOperation: ${mode === 'create' ? 'Create' : 'Update'} User\nUsername: ${data.Username}\nEmail: ${data.Email}\nRoles: ${selectedRoles.length} selected`,
        suggestions: [
          'Verify that all required fields are filled correctly',
          'Check that the username and email are unique',
          'Ensure password meets security requirements (for new users)',
          'Verify that you have permission to create/edit users',
          'Try again in a few moments',
          'Contact your system administrator if the problem persists'
        ]
      });
    }
  };

  const handleClose = () => {
    reset();
    setSelectedRoles([]);
    onClose();
  };

  return {
    form: {
      register,
      handleSubmit,
      watch,
      errors,
      isSubmitting
    },
    roles,
    selectedRoles,
    isLoadingRoles,
    password,
    handleRoleToggle,
    handleFormSubmit,
    handleClose
  };
};