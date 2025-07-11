import React, { useState, useEffect } from 'react';
import { 
  Users, 
  X, 
  Search,
  UserCheck,
  UserX,
  Crown,
  Shield,
  Save,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { roleService, Role, UserRoleInfo } from '../../services/roleService';
import { usersService, UserManagement } from '../../services/usersService';
import { useNotifications } from '../../contexts/NotificationContext';

interface RoleUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role;
}

interface UserRoleChange {
  userId: number;
  username: string;
  currentRole: Role;
  newRoleId: number | null;
  action: 'assign' | 'remove' | 'change' | 'none';
}

const RoleUsersModal: React.FC<RoleUsersModalProps> = ({
  isOpen,
  onClose,
  role
}) => {
  const { addNotification } = useNotifications();
  
  const [roleUsers, setRoleUsers] = useState<UserRoleInfo[]>([]);
  const [allUsers, setAllUsers] = useState<UserManagement[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [changes, setChanges] = useState<Map<number, UserRoleChange>>(new Map());
  
  // Load data when modal opens
  useEffect(() => {
    if (isOpen && role?.Id) {
      loadData();
    }
  }, [isOpen, role?.Id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [users, roleUsersData, rolesData] = await Promise.all([
        usersService.getAllUsers(),
        roleService.getRoleUsers(role.Id),
        roleService.getAllRoles()
      ]);
      
      setAllUsers(users || []);
      setRoleUsers(roleUsersData || []);
      setAllRoles((rolesData || []).filter(r => r.Id !== role.Id)); // Exclude current role
      setChanges(new Map()); // Reset changes
    } catch (error) {
      console.error('Error loading data:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to load role users data',
        type: 'error',
        source: 'RoleUsersModal'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (userId: number, username: string, newRoleId: number | null) => {
    const newChanges = new Map(changes);
    
    if (newRoleId === null) {
      // Remove user from role
      newChanges.set(userId, {
        userId,
        username,
        currentRole: role,
        newRoleId: null,
        action: 'remove'
      });
    } else if (newRoleId === -1) {
      // No change (keep in current role)
      newChanges.delete(userId);
    } else {
      // Change to different role
      const newRole = allRoles.find(r => r.Id === newRoleId);
      if (newRole) {
        newChanges.set(userId, {
          userId,
          username,
          currentRole: role,
          newRoleId,
          action: 'change'
        });
      }
    }
    
    setChanges(newChanges);
  };

  const handleAddUser = (userId: number) => {
    const user = allUsers.find(u => u.Id === userId);
    if (!user) return;

    const newChanges = new Map(changes);
    newChanges.set(userId, {
      userId,
      username: user.Username,
      currentRole: role,
      newRoleId: role.Id,
      action: 'assign'
    });
    setChanges(newChanges);
  };

  const handleSaveChanges = async () => {
    if (changes.size === 0) {
      addNotification({
        title: 'No Changes',
        message: 'No changes to save',
        type: 'info',
        source: 'RoleUsersModal'
      });
      return;
    }

    setSaving(true);
    
    try {
      const operations = Array.from(changes.values());
      let successCount = 0;
      let errorCount = 0;

      for (const change of operations) {
        try {
          switch (change.action) {
            case 'remove':
              await roleService.removeUsersFromRole(role.Id, [change.userId]);
              break;
            case 'assign':
              await roleService.assignUsersToRole(role.Id, [change.userId]);
              break;
            case 'change':
              if (change.newRoleId) {
                // Remove from current role and assign to new role
                await roleService.removeUsersFromRole(role.Id, [change.userId]);
                await roleService.assignUsersToRole(change.newRoleId, [change.userId]);
              }
              break;
          }
          successCount++;
        } catch (error) {
          console.error(`Error processing change for user ${change.username}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        addNotification({
          title: 'Success',
          message: `Successfully processed ${successCount} user role change(s)`,
          type: 'success',
          source: 'RoleUsersModal'
        });
      }

      if (errorCount > 0) {
        addNotification({
          title: 'Partial Success',
          message: `${errorCount} changes failed to process`,
          type: 'warning',
          source: 'RoleUsersModal'
        });
      }

      // Reload data and close modal
      await loadData();
      if (errorCount === 0) {
        onClose();
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to save role changes',
        type: 'error',
        source: 'RoleUsersModal'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setChanges(new Map());
  };

  // Get current users for display (including pending changes)
  const getCurrentUsers = () => {
    const currentUserIds = roleUsers.map(u => u.UserId);
    const usersToShow = [...roleUsers];
    
    // Add users being assigned to this role
    changes.forEach((change) => {
      if (change.action === 'assign' && !currentUserIds.includes(change.userId)) {
        const user = allUsers.find(u => u.Id === change.userId);
        if (user) {
          usersToShow.push({
            UserId: user.Id,
            Username: user.Username,
            Email: user.Email,
            FirstName: user.FirstName || '',
            LastName: user.LastName || '',
            IsActive: user.IsActive,
            AssignedAt: new Date().toISOString(),
            AssignedBy: undefined,
            AssignedByName: 'Pending'
          });
        }
      }
    });

    return usersToShow.filter(user => {
      const change = changes.get(user.UserId);
      return !change || change.action !== 'remove';
    });
  };

  // Get available users (not in current role)
  const getAvailableUsers = () => {
    const currentUserIds = roleUsers.map(u => u.UserId);
    return allUsers.filter(user => 
      !currentUserIds.includes(user.Id) && 
      user.IsActive &&
      !changes.has(user.Id)
    );
  };

  const filteredCurrentUsers = getCurrentUsers().filter(user =>
    user.Username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.FirstName && user.FirstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.LastName && user.LastName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredAvailableUsers = getAvailableUsers().filter(user =>
    user.Username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.FirstName && user.FirstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.LastName && user.LastName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {role.IsSystem ? (
              <Crown className="w-6 h-6 text-yellow-200" />
            ) : (
              <Shield className="w-6 h-6 text-white" />
            )}
            <div>
              <h3 className="text-lg font-semibold text-white">
                Manage Users - {role.Name}
              </h3>
              <p className="text-sm text-primary-100">
                {role.Description || 'No description'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-primary-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(85vh-140px)] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-300">Loading users...</p>
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="input pl-10 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Changes Summary */}
              {changes.size > 0 && (
                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="font-medium text-yellow-800 dark:text-yellow-200">
                      Pending Changes ({changes.size})
                    </span>
                  </div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">
                    {Array.from(changes.values()).map((change, index) => (
                      <div key={change.userId}>
                        {change.action === 'remove' && `Remove ${change.username} from ${role.Name}`}
                        {change.action === 'assign' && `Add ${change.username} to ${role.Name}`}
                        {change.action === 'change' && `Move ${change.username} to ${allRoles.find(r => r.Id === change.newRoleId)?.Name}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Users */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Current Users ({filteredCurrentUsers.length})
                  </h4>
                  
                  {role.IsSystem ? (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        System roles cannot be modified
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {filteredCurrentUsers.map((user) => {
                        const change = changes.get(user.UserId);
                        const isPendingRemoval = change?.action === 'remove';
                        const isPendingChange = change?.action === 'change';
                        const isPendingAdd = change?.action === 'assign';
                        
                        return (
                          <div 
                            key={user.UserId}
                            className={`p-3 border rounded-lg ${
                              isPendingRemoval 
                                ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' 
                                : isPendingChange 
                                  ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
                                  : isPendingAdd
                                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                                    : 'border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-primary-600">
                                    {user.FirstName?.[0] || user.Username[0]}{user.LastName?.[0] || ''}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {user.FirstName} {user.LastName}
                                  </p>
                                  <p className="text-sm text-gray-500">@{user.Username}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span className={`badge ${user.IsActive ? 'badge-success' : 'badge-secondary'}`}>
                                  {user.IsActive ? (
                                    <>
                                      <UserCheck className="w-3 h-3 mr-1" />
                                      Active
                                    </>
                                  ) : (
                                    <>
                                      <UserX className="w-3 h-3 mr-1" />
                                      Inactive
                                    </>
                                  )}
                                </span>
                                
                                <select
                                  value={
                                    isPendingRemoval ? 'remove' :
                                    isPendingChange ? change.newRoleId :
                                    -1
                                  }
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === 'remove') {
                                      handleRoleChange(user.UserId, user.Username, null);
                                    } else if (value === '-1') {
                                      handleRoleChange(user.UserId, user.Username, -1);
                                    } else {
                                      handleRoleChange(user.UserId, user.Username, parseInt(value));
                                    }
                                  }}
                                  className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                                >
                                  <option value={-1}>Keep in {role.Name}</option>
                                  <option value="remove">Remove from role</option>
                                  {allRoles.filter(r => r.IsActive).map(r => (
                                    <option key={r.Id} value={r.Id}>
                                      Move to {r.Name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            
                            {(isPendingRemoval || isPendingChange || isPendingAdd) && (
                              <div className="mt-2 text-xs">
                                {isPendingRemoval && <span className="text-red-600">Will be removed from {role.Name}</span>}
                                {isPendingChange && <span className="text-yellow-600">Will be moved to {allRoles.find(r => r.Id === change.newRoleId)?.Name}</span>}
                                {isPendingAdd && <span className="text-green-600">Will be added to {role.Name}</span>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      {filteredCurrentUsers.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          {searchTerm ? 'No matching users found' : 'No users assigned to this role'}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Available Users */}
                {!role.IsSystem && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Available Users ({filteredAvailableUsers.length})
                    </h4>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {filteredAvailableUsers.map((user) => (
                        <div 
                          key={user.Id}
                          className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-primary-600">
                                  {user.FirstName?.[0] || user.Username[0]}{user.LastName?.[0] || ''}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {user.FirstName} {user.LastName}
                                </p>
                                <p className="text-sm text-gray-500">@{user.Username}</p>
                                {user.Roles?.length > 0 && (
                                  <p className="text-xs text-gray-400">
                                    Current: {user.Roles.map(r => r.Name).join(', ')}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <button
                              onClick={() => handleAddUser(user.Id)}
                              className="btn btn-sm btn-primary"
                            >
                              Add to Role
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {filteredAvailableUsers.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          {searchTerm ? 'No matching available users' : 'No available users to assign'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {changes.size > 0 && `${changes.size} pending change(s)`}
          </div>
          
          <div className="flex gap-3">
            {changes.size > 0 && (
              <button
                onClick={handleReset}
                disabled={saving}
                className="btn btn-secondary flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            )}
            
            <button
              onClick={onClose}
              disabled={saving}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            
            {!role.IsSystem && (
              <button
                onClick={handleSaveChanges}
                disabled={saving || changes.size === 0}
                className="btn btn-primary flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleUsersModal;