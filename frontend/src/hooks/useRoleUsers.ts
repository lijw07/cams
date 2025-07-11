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
      addNotification({
        title: 'Error',
        message: 'Failed to load role users',
        type: 'error',
        source: 'RoleUsers'
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
      
      addNotification({
        title: 'Success',
        message: 'Role assignments updated successfully',
        type: 'success',
        source: 'RoleUsers'
      });
      
      setChanges(new Map());
      await loadData();
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to update role assignments',
        type: 'error',
        source: 'RoleUsers'
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