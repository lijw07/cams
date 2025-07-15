import { useEffect, useRef } from 'react';
import { useModal } from '../contexts/ModalContext';

export const useModalStack = (isOpen: boolean, onClose: () => void) => {
  const modalContext = useModal();
  const modalId = useRef(Math.random().toString(36).substr(2, 9));
  const unregisterRef = useRef<(() => void) | null>(null);

  // If modal context is not available, fail gracefully
  if (!modalContext) {
    console.warn('useModalStack: Modal context not available. Make sure ModalProvider is properly configured.');
    return modalId.current;
  }

  const { registerModal } = modalContext;

  useEffect(() => {
    if (!registerModal) return; // Skip if modal context is not available
    
    if (isOpen) {
      // Register this modal when it opens
      unregisterRef.current = registerModal(modalId.current, onClose);
    } else {
      // Unregister this modal when it closes
      if (unregisterRef.current) {
        unregisterRef.current();
        unregisterRef.current = null;
      }
    }

    return () => {
      // Cleanup on unmount
      if (unregisterRef.current) {
        unregisterRef.current();
      }
    };
  }, [isOpen, onClose, registerModal]);

  // Generate new modal ID if component re-renders with different props
  useEffect(() => {
    modalId.current = Math.random().toString(36).substr(2, 9);
  }, []);

  return modalId.current;
};