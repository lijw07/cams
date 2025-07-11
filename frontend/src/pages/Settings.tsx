import React, { useState, useEffect } from 'react';

import { Monitor, Moon, Sun, Clock, Trash2, AlertTriangle } from 'lucide-react';

import ConnectionTestScheduling from '../components/settings/ConnectionTestScheduling';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';
import { profileService } from '../services/profileService';

const Settings: React.FC = () => {
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { addNotification } = useNotifications();
  const [timezone, setTimezone] = useState<string>('UTC');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Get available timezones - fallback for older browsers
  const timezones = (Intl as any).supportedValuesOf ? (Intl as any).supportedValuesOf('timeZone') : [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai', 'Australia/Sydney'
  ];
  const popularTimezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
    'UTC'
  ];

  useEffect(() => {
    // Load saved timezone or detect user's timezone
    const savedTimezone = localStorage.getItem('timezone');
    if (savedTimezone) {
      setTimezone(savedTimezone);
    } else {
      try {
        const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setTimezone(detectedTimezone || 'UTC');
      } catch (error) {
        console.warn('Could not detect timezone:', error);
        setTimezone('UTC');
      }
    }
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    
    // Add notification for theme change
    addNotification({
      title: 'Theme Updated',
      message: `Appearance changed to ${newTheme} mode`,
      type: 'success',
      source: 'Settings',
      actionUrl: '/settings'
    });
  };

  const handleTimezoneChange = (newTimezone: string) => {
    setTimezone(newTimezone);
    localStorage.setItem('timezone', newTimezone);
    
    // Add notification for timezone change
    addNotification({
      title: 'Timezone Updated',
      message: `Timezone changed to ${newTimezone}`,
      type: 'info',
      source: 'Settings',
      actionUrl: '/settings'
    });
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      addNotification({
        title: 'Password Required',
        message: 'Please enter your password to delete account',
        type: 'error',
        source: 'Settings'
      });
      return;
    }

    setIsDeleting(true);
    try {
      await profileService.deactivateAccount({ CurrentPassword: deletePassword });
      addNotification({
        title: 'Account Deleted',
        message: 'Your account has been successfully deleted',
        type: 'success',
        source: 'Settings'
      });
      await logout();
    } catch (error: any) {
      addNotification({
        title: 'Delete Failed',
        message: error.response?.data?.message || 'Failed to delete account',
        type: 'error',
        source: 'Settings'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTimezoneOption = (tz: string): string => {
    try {
      if (!tz || tz.trim() === '') return 'UTC';
      
      const now = new Date();
      const offset = new Intl.DateTimeFormat('en', {
        timeZone: tz,
        timeZoneName: 'short'
      }).formatToParts(now).find(part => part.type === 'timeZoneName')?.value || '';
      
      return `${tz} (${offset})`;
    } catch (error) {
      console.warn(`Invalid timezone: ${tz}`, error);
      return tz;
    }
  };

  // Test function to generate sample notifications
  const generateTestNotifications = () => {
    const testNotifications = [
      {
        title: 'New Application Created',
        message: 'Application "Production API" has been successfully created',
        type: 'success' as const,
        source: 'Applications',
        actionUrl: '/applications'
      },
      {
        title: 'Database Connection Failed',
        message: 'Connection to MySQL database could not be established',
        type: 'error' as const,
        source: 'Database',
        actionUrl: '/applications'
      },
      {
        title: 'User Role Updated',
        message: 'Your role has been updated to Admin',
        type: 'info' as const,
        source: 'User Management',
        actionUrl: '/management/users'
      },
      {
        title: 'Performance Alert',
        message: 'High CPU usage detected on server cluster',
        type: 'warning' as const,
        source: 'Performance',
        actionUrl: '/logs/performance'
      }
    ];

    testNotifications.forEach(notification => {
      addNotification(notification);
    });

    addNotification({
      title: 'Test Complete',
      message: 'Sample notifications have been added to your bell',
      type: 'success',
      source: 'Settings'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">Settings</h1>
        <p className="text-secondary-600 dark:text-secondary-400">Manage your preferences and account settings</p>
      </div>

      {/* Theme Settings */}
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Appearance</h2>
        <div className="space-y-3">
          <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4">
            Choose how the interface looks. System will follow your device's theme.
          </p>
          
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleThemeChange('light')}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors ${
                theme === 'light'
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-300 dark:hover:border-secondary-600'
              }`}
            >
              <Sun className="w-6 h-6 text-secondary-700 dark:text-secondary-300 mb-2" />
              <span className="text-sm font-medium text-secondary-900 dark:text-white">Light</span>
            </button>

            <button
              onClick={() => handleThemeChange('dark')}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors ${
                theme === 'dark'
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-300 dark:hover:border-secondary-600'
              }`}
            >
              <Moon className="w-6 h-6 text-secondary-700 dark:text-secondary-300 mb-2" />
              <span className="text-sm font-medium text-secondary-900 dark:text-white">Dark</span>
            </button>

            <button
              onClick={() => handleThemeChange('system')}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors ${
                theme === 'system'
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-300 dark:hover:border-secondary-600'
              }`}
            >
              <Monitor className="w-6 h-6 text-secondary-700 dark:text-secondary-300 mb-2" />
              <span className="text-sm font-medium text-secondary-900 dark:text-white">System</span>
            </button>
          </div>
        </div>
      </div>

      {/* Timezone Settings */}
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">
          <Clock className="w-5 h-5 inline mr-2" />
          Timezone
        </h2>
        <div className="space-y-4">
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            Set your timezone to see dates and times in your local time.
          </p>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Current timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => handleTimezoneChange(e.target.value)}
              className="input w-full max-w-md dark:bg-secondary-700 dark:border-secondary-600 dark:text-white"
            >
              <optgroup label="Popular Timezones">
                {popularTimezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {formatTimezoneOption(tz)}
                  </option>
                ))}
              </optgroup>
              <optgroup label="All Timezones">
                {timezones
                  .filter((tz: string) => tz && tz.trim() !== '' && !popularTimezones.includes(tz))
                  .map((tz: string) => (
                    <option key={tz} value={tz}>
                      {formatTimezoneOption(tz)}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          <div className="text-sm text-secondary-600 dark:text-secondary-400">
            Current time: {(() => {
              try {
                return new Date().toLocaleString('en-US', { 
                  timeZone: timezone || 'UTC',
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                });
              } catch (error) {
                return new Date().toLocaleString('en-US');
              }
            })()}
          </div>
        </div>
      </div>

      {/* Connection Test Scheduling */}
      <ConnectionTestScheduling />

      {/* Testing Section */}
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow p-6 border-l-4 border-blue-500">
        <h2 className="text-lg font-semibold text-blue-700 dark:text-blue-400 mb-4">
          Testing & Development
        </h2>
        <div className="space-y-4">
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            Test the notification system with sample notifications.
          </p>
          
          <button
            onClick={generateTestNotifications}
            className="btn btn-primary"
          >
            Generate Test Notifications
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow p-6 border-l-4 border-red-500">
        <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-4">
          <AlertTriangle className="w-5 h-5 inline mr-2" />
          Danger Zone
        </h2>
        <div className="space-y-4">
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          
          <button
            onClick={() => setShowDeleteModal(true)}
            className="btn bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-secondary-500 bg-opacity-75" onClick={() => setShowDeleteModal(false)}></div>

            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-secondary-800 shadow-xl rounded-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">Delete Account</h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="p-2 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-red-800 dark:text-red-400">
                        This action cannot be undone
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        This will permanently delete your account and all associated data.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Enter your password to confirm
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="input w-full dark:bg-secondary-700 dark:border-secondary-600 dark:text-white"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="btn btn-secondary"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="btn bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500"
                  disabled={isDeleting || !deletePassword.trim()}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;