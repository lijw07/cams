import React, { useState, useEffect, useRef } from 'react';
import { Menu, User, Settings, LogOut, Bell, X, Trash2, CheckCheck, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { Notification } from '../../types';
import { useEventTracking } from '../../hooks/useEventTracking';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications } = useNotifications();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { trackAuthentication, trackNavigation } = useEventTracking();

  const handleLogout = async () => {
    try {
      await logout();
      
      // Track logout event
      trackAuthentication('logout', true);
      
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      
      // Track logout failure
      trackAuthentication('logout', false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    setNotificationMenuOpen(false);
    
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return minutes <= 1 ? 'Just now' : `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  // Handle clicking outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white dark:bg-secondary-800 shadow-sm border-b border-secondary-200 dark:border-secondary-700">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side - Menu button and title */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-md text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white hover:bg-secondary-100 dark:hover:bg-secondary-700 md:hidden"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>
          
          <div>
            <h1 className="text-xl font-semibold text-secondary-900 dark:text-white">
              Centralized Application Management System
            </h1>
          </div>
        </div>

        {/* Right side - Notifications and user menu */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setNotificationMenuOpen(!notificationMenuOpen)}
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              aria-expanded={notificationMenuOpen}
              aria-controls="notification-menu"
              className="p-2 rounded-md text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white hover:bg-secondary-100 dark:hover:bg-secondary-700 relative"
            >
              <Bell className="w-5 h-5" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                  <span className="sr-only">{unreadCount} unread notifications</span>
                </span>
              )}
            </button>

            {/* Notifications dropdown */}
            {notificationMenuOpen && (
              <div id="notification-menu" role="menu" aria-label="Notifications menu" className="absolute right-0 mt-2 w-80 bg-white dark:bg-secondary-800 rounded-md shadow-lg border border-secondary-200 dark:border-secondary-700 z-50 max-h-96 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-secondary-200 dark:border-secondary-700">
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
                    Notifications
                  </h3>
                  <div className="flex items-center space-x-2">
                    {notifications.length > 0 && (
                      <>
                        <button
                          onClick={() => {
                            markAllAsRead();
                          }}
                          aria-label="Mark all notifications as read"
                          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                          title="Mark all as read"
                        >
                          <CheckCheck className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => {
                            clearAllNotifications();
                          }}
                          aria-label="Clear all notifications"
                          className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                          title="Clear all"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setNotificationMenuOpen(false)}
                      aria-label="Close notifications"
                      className="p-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Notifications list */}
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-secondary-500 dark:text-secondary-400">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No notifications</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-secondary-100 dark:border-secondary-700 last:border-b-0 cursor-pointer hover:bg-secondary-50 dark:hover:bg-secondary-700 ${
                          !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            {getNotificationIcon(notification.type)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className={`text-sm font-medium ${
                                  !notification.isRead 
                                    ? 'text-secondary-900 dark:text-white' 
                                    : 'text-secondary-700 dark:text-secondary-300'
                                }`}>
                                  {notification.title}
                                </p>
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-secondary-500 dark:text-secondary-500">
                                  {formatTimestamp(notification.timestamp)}
                                </p>
                                {notification.source && (
                                  <span className="text-xs text-secondary-500 dark:text-secondary-500 bg-secondary-100 dark:bg-secondary-700 px-2 py-1 rounded">
                                    {notification.source}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            aria-label={`Delete notification: ${notification.title}`}
                            className="ml-2 p-1 text-secondary-400 hover:text-red-500 dark:hover:text-red-400"
                            title="Delete notification"
                          >
                            <X className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-label="User menu"
              aria-expanded={userMenuOpen}
              aria-controls="user-menu"
              className="flex items-center space-x-2 p-2 rounded-md text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white hover:bg-secondary-100 dark:hover:bg-secondary-700"
            >
              <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center border-2 border-secondary-300 shadow-sm">
                {user?.FirstName?.[0] || user?.Username?.[0] || 'U'}
              </div>
              <span className="text-sm font-medium hidden md:block text-secondary-900 dark:text-white">
                {user?.FirstName && user?.LastName 
                  ? `${user.FirstName} ${user.LastName}`
                  : user?.Username || 'User'
                }
              </span>
            </button>

            {/* User dropdown menu */}
            {userMenuOpen && (
              <div id="user-menu" role="menu" aria-label="User account menu" className="absolute right-0 mt-2 w-48 bg-white dark:bg-secondary-800 rounded-md shadow-lg border border-secondary-200 dark:border-secondary-700 py-1 z-50">
                <div className="px-4 py-2 text-sm text-secondary-700 dark:text-secondary-300 border-b border-secondary-200 dark:border-secondary-700">
                  <div className="font-medium">
                    {user?.FirstName && user?.LastName 
                      ? `${user.FirstName} ${user.LastName}`
                      : user?.Username || 'User'
                    }
                  </div>
                  <div className="text-xs text-secondary-500 dark:text-secondary-400">{user?.Email}</div>
                </div>
                
                <button
                  onClick={() => {
                    trackNavigation('/profile', 'header_menu');
                    navigate('/profile');
                    setUserMenuOpen(false);
                  }}
                  role="menuitem"
                  className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700"
                >
                  <User className="w-4 h-4" aria-hidden="true" />
                  <span>Profile</span>
                </button>
                
                <button
                  onClick={() => {
                    trackNavigation('/settings', 'header_menu');
                    navigate('/settings');
                    setUserMenuOpen(false);
                  }}
                  role="menuitem"
                  className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700"
                >
                  <Settings className="w-4 h-4" aria-hidden="true" />
                  <span>Settings</span>
                </button>
                
                <div className="border-t border-secondary-200 dark:border-secondary-700 mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    role="menuitem"
                    className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;