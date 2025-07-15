import React from 'react';

import { AlertCircle, CheckCircle, Info, AlertTriangle, Clock, Settings } from 'lucide-react';

import { useModalStack } from '../../hooks/useModalStack';
import { Notification } from '../../types';
import Button from '../common/Button';
import Modal from '../common/Modal';

interface NotificationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: Notification | null;
}

const NotificationDetailsModal: React.FC<NotificationDetailsModalProps> = ({
  isOpen,
  onClose,
  notification
}) => {
  // Register this modal with the modal stack
  useModalStack(isOpen, onClose);

  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  const getColorClasses = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Notification Details">
      <div className="space-y-6">
        {/* Header Info */}
        <div className={`p-4 rounded-lg border ${getColorClasses()}`}>
          <div className="flex items-start space-x-3">
            {getIcon()}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {notification.title}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mt-1">
                {notification.message}
              </p>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">
              {notification.timestamp.toLocaleString()}
            </span>
          </div>
          {notification.source && (
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                Source: {notification.source}
              </span>
            </div>
          )}
        </div>

        {/* Additional Details */}
        {notification.details && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Details
            </h4>
            <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              {notification.details}
            </p>
          </div>
        )}

        {/* Technical Details */}
        {notification.technical && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Technical Information
            </h4>
            <div className="bg-gray-900 dark:bg-gray-800 text-gray-100 p-3 rounded-md font-mono text-sm overflow-x-auto">
              <pre className="whitespace-pre-wrap">{notification.technical}</pre>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {notification.suggestions && notification.suggestions.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Suggested Actions
            </h4>
            <ul className="space-y-2">
              {notification.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span className="text-gray-700 dark:text-gray-300">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          {notification.actionUrl && (
            <Button onClick={() => window.open(notification.actionUrl, '_blank')}>
              Take Action
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default NotificationDetailsModal;