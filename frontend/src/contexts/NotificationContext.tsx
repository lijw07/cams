import React, { createContext, useContext, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { Notification, NotificationContextType } from '../types';
import NotificationDetailsModal from '../components/modals/NotificationDetailsModal';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const navigate = useNavigate();

  // Load notifications from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        // Convert timestamp strings back to Date objects
        const notificationsWithDates = parsed.map((notif: any) => ({
          ...notif,
          timestamp: new Date(notif.timestamp)
        }));
        setNotifications(notificationsWithDates);
      } catch (error) {
        console.error('Failed to parse saved notifications:', error);
        localStorage.removeItem('notifications');
      }
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      isRead: false,
    };

    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(notif => !notif.isRead).length;

  // Show notification details modal
  const showNotificationDetails = (notification: Notification) => {
    console.log('showNotificationDetails called for:', notification.title);
    setSelectedNotification(notification);
    setIsDetailsModalOpen(true);
    markAsRead(notification.id);
  };

  // Helper function to handle notification click with navigation
  const handleNotificationClick = (notification: Notification) => {
    console.log('handleNotificationClick called with:', {
      id: notification.id,
      title: notification.title,
      hasDetails: !!notification.details,
      hasTechnical: !!notification.technical,
      hasSuggestions: !!notification.suggestions?.length,
      suggestions: notification.suggestions,
      source: notification.source
    });
    
    // Always show the notification details modal when clicked
    console.log('Showing notification details modal');
    showNotificationDetails(notification);
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification: deleteNotification,
    deleteNotification,
    clearAllNotifications,
    showNotificationDetails,
    handleNotificationClick,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        notification={selectedNotification}
      />
    </NotificationContext.Provider>
  );
};