import React, { useEffect, useRef, useId } from 'react';

import { X } from 'lucide-react';

import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useModalStack } from '../../hooks/useModalStack';

import Button from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  disableStackManagement?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  disableStackManagement = false
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const contentId = useId();
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const mouseDownTarget = useRef<EventTarget | null>(null);

  // Register this modal with the modal stack (unless disabled)
  if (!disableStackManagement) {
    try {
      useModalStack(isOpen, onClose);
    } catch (error) {
      // If modal stack is not available, continue without it
      console.warn('Modal stack not available, falling back to individual modal handling');
    }
  }

  // Use focus trap hook
  useFocusTrap(modalRef, isOpen);

  // Handle escape key and focus management
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      // Only handle ESC if stack management is disabled (for legacy modals)
      if (disableStackManagement && closeOnEscape && event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      // Store currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      if (disableStackManagement) {
        document.addEventListener('keydown', handleEscape);
      }
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      // Also set position fixed to prevent iOS scroll issues
      document.body.style.position = 'fixed';
      document.body.style.top = `-${window.scrollY}px`;
      document.body.style.width = '100%';
      
      // Only focus the modal container if no other element is focused
      // This prevents stealing focus from input fields
      setTimeout(() => {
        if (!document.activeElement || document.activeElement === document.body) {
          modalRef.current?.focus();
        }
      }, 0);
    }

    return () => {
      if (disableStackManagement) {
        document.removeEventListener('keydown', handleEscape);
      }
      
      // Restore body scroll
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
      
      // Restore focus to previous element
      if (previousActiveElement.current && document.body.contains(previousActiveElement.current)) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, closeOnEscape, onClose, disableStackManagement]);

  // Handle mouse down to track where click started
  const handleMouseDown = (event: React.MouseEvent) => {
    mouseDownTarget.current = event.target;
  };

  // Handle click outside - only close if both mousedown and mouseup happened on overlay
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlayClick && 
        event.target === event.currentTarget && 
        mouseDownTarget.current === event.target) {
      onClose();
    }
    // Reset the mouse down target
    mouseDownTarget.current = null;
  };

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div 
        className="flex items-center justify-center min-h-screen p-4"
        onMouseDown={handleMouseDown}
        onClick={handleOverlayClick}
      >
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
          aria-hidden="true"
        />

        {/* Modal */}
        <div 
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={contentId}
          tabIndex={-1}
          className={`relative bg-white dark:bg-secondary-800 rounded-lg shadow-xl w-full ${sizeClasses[size]} p-6`}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between mb-6">
              {title && (
                <h2 
                  id={titleId}
                  className="text-xl font-semibold text-secondary-900 dark:text-white"
                >
                  {title}
                </h2>
              )}
              {showCloseButton && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="p-1 rounded-md text-secondary-400 dark:text-secondary-500 hover:text-secondary-500 dark:hover:text-secondary-400"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </Button>
              )}
            </div>
          )}

          {/* Content */}
          <div id={contentId} className="modal-content">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;