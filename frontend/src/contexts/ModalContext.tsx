import React, { createContext, useContext, useRef, useEffect, ReactNode } from 'react';

interface ModalContextType {
  registerModal: (id: string, onClose: () => void) => () => void;
  closeTopModal: () => boolean;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

interface ModalStackItem {
  id: string;
  onClose: () => void;
}

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const modalStackRef = useRef<ModalStackItem[]>([]);

  const registerModal = (id: string, onClose: () => void) => {
    // Add modal to the top of the stack
    modalStackRef.current.push({ id, onClose });
    
    // Return unregister function
    return () => {
      modalStackRef.current = modalStackRef.current.filter(modal => modal.id !== id);
    };
  };

  const closeTopModal = () => {
    const stack = modalStackRef.current;
    if (stack.length > 0) {
      const topModal = stack[stack.length - 1];
      topModal.onClose();
      return true; // Modal was closed
    }
    return false; // No modal to close
  };

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const wasClosed = closeTopModal();
        if (wasClosed) {
          event.preventDefault();
          event.stopPropagation();
        }
      }
    };

    document.addEventListener('keydown', handleEscapeKey, true);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey, true);
    };
  }, []);

  return (
    <ModalContext.Provider value={{ registerModal, closeTopModal }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    // In development, log a warning but don't throw
    if (process.env.NODE_ENV === 'development') {
      console.warn('useModal: ModalProvider not found. Modal stack management will be disabled.');
    }
    return null;
  }
  return context;
};