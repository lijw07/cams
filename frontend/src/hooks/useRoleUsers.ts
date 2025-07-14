import { useState, useEffect } from 'react';

import { useNotifications } from '../contexts/NotificationContext';
import { roleService, Role, UserRoleInfo } from '../services/roleService';
import { usersService, UserManagement } from '../services/usersService';

interface UserRoleChange {
  userId: string;
  username: string;
  currentRole: Role;
  newRoleId: string | null;
  action: 'assign' | 'remove' | 'change' | 'none';
}

export const useRoleUsers = (role: Role | null, isOpen: boolean) => {
  const [roleUsers, setRoleUsers] = useState<UserRoleInfo[]>([]);
  const [allUsers, setAllUsers] = useState<UserManagement[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [changes, setChanges] = useState<Map<string, UserRoleChange>>(new Map());
  const { addNotification } = useNotifications();

  const loadData = async () => {
    if (!role?.Id) return;
    
    setLoading(true);
    try {
      const [usersData, allUsersData, rolesData] = await Promise.all([
        roleService.getRoleUsers(role.Id),
        usersService.getAllUsers(),
        roleService.getAllRoles()
      ]);
      
      setRoleUsers(usersData);
      setAllUsers(allUsersData);
      setAllRoles(rolesData);
    } catch (error) {
      // Extract error code from the error response
      let errorCode = 'UNKNOWN_ERROR';
      let errorMessage = 'Failed to load role users';
      
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
        title: `Failed to Load Role Users (${errorCode})`,
        message: errorMessage,
        type: 'error',
        source: 'Role Management',
        details: `Could not load users for role "${role?.Name}" with error code: ${errorCode}.`,
        technical: `Error Code: ${errorCode}\nError Message: ${errorMessage}\nOperation: Load Role Users\nRole ID: ${role?.Id}\nRole Name: ${role?.Name}`,
        suggestions: [
          'Check your internet connection',
          'Verify that you have permission to view role assignments',
          'Ensure the role exists and is accessible',
          'Try refreshing the page',
          'Contact your system administrator if the problem persists'
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && role?.Id) {
      loadData();
      setChanges(new Map());
      setSearchTerm('');
    }
  }, [isOpen, role?.Id]);

  const handleRoleChange = (userId: string, newRoleId: string | null) => {
    const user = allUsers.find(u => u.Id === userId);
    const currentUserRole = roleUsers.find(ru => ru.UserId === userId);
    
    if (!user) return;

    const change: UserRoleChange = {
      userId,
      username: user.Username,
      currentRole: role!,
      newRoleId,
      action: newRoleId === null ? 'remove' : 
              currentUserRole ? 'change' : 'assign'
    };

    const newChanges = new Map(changes);
    if (newRoleId === null && !currentUserRole) {
      newChanges.delete(userId);
    } else {
      newChanges.set(userId, change);
    }
    setChanges(newChanges);
  };

  const saveChanges = async () => {
    if (changes.size === 0) return;
    
    setSaving(true);
    try {
      for (const change of changes.values()) {
        if (change.action === 'assign' && change.newRoleId) {
          await roleService.assignUsersToRole(change.newRoleId, [change.userId]);
        } else if (change.action === 'remove') {
          await roleService.removeUsersFromRole(role!.Id, [change.userId]);
        } else if (change.action === 'change' && change.newRoleId) {
          await roleService.removeUsersFromRole(role!.Id, [change.userId]);
          await roleService.assignUsersToRole(change.newRoleId, [change.userId]);
        }
      }
      
      const changeCount = changes.size;
      const operationSummary = Array.from(changes.values())
        .reduce((acc, change) => {
          acc[change.action] = (acc[change.action] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      
      const operations = Object.entries(operationSummary)
        .map(([action, count]) => `${count} ${action}${count > 1 ? 'd' : ''}${action === 'assign' ? 'ed' : action === 'change' ? 'd' : 'd'}`)
        .join(', ');
      
      addNotification({
        title: 'Role Assignments Updated Successfully',
        message: `${changeCount} role assignment${changeCount > 1 ? 's' : ''} updated successfully`,
        type: 'success',
        source: 'Role Management',
        details: `Role assignments for role "${role?.Name}" have been updated: ${operations}. All changes have been applied successfully.`,
        suggestions: [
          'Inform affected users of their role changes',
          'Review the updated permissions and access levels',
          'Monitor system activity for any issues',
          'Update any related documentation'
        ]
      });
      
      setChanges(new Map());
      await loadData();
    } catch (error) {
      // Extract error code from the error response
      let errorCode = 'UNKNOWN_ERROR';
      let errorMessage = 'Failed to update role assignments';
      
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
      
      const changeCount = changes.size;
      const usernames = Array.from(changes.values()).map(c => c.username).join(', ');
      
      addNotification({
        title: `Role Assignment Update Failed (${errorCode})`,
        message: errorMessage,
        type: 'error',
        source: 'Role Management',
        details: `Failed to update ${changeCount} role assignment${changeCount > 1 ? 's' : ''} for role "${role?.Name}" with error code: ${errorCode}.`,
        technical: `Error Code: ${errorCode}\nError Message: ${errorMessage}\nOperation: Update Role Assignments\nRole ID: ${role?.Id}\nRole Name: ${role?.Name}\nAffected Users: ${usernames}\nChanges Count: ${changeCount}`,
        suggestions: [
          'Verify that you have permission to modify role assignments',
          'Check if the users exist and are accessible',
          'Ensure the target roles are valid and active',
          'Try updating assignments one at a time',
          'Try again in a few moments',
          'Contact your system administrator if the problem persists'
        ]
      });
    } finally {
      setSaving(false);
    }
  };

  const resetChanges = () => {
    setChanges(new Map());
  };

  const filteredUsers = allUsers.filter(user =>
    user.Username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.Email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.FirstName && user.FirstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.LastName && user.LastName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return {
    roleUsers,
    allUsers: filteredUsers,
    allRoles,
    loading,
    saving,
    searchTerm,
    setSearchTerm,
    changes,
    handleRoleChange,
    saveChanges,
    resetChanges,
    hasChanges: changes.size > 0
  };
};