import { useState, useEffect } from 'react';

import { useForm } from 'react-hook-form';

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
      handleClose();
    } catch (error) {
      // Error handled by parent
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