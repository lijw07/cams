import React from 'react';

import { useApplicationModal } from '../../hooks/useApplicationModal';
import { useModalStack } from '../../hooks/useModalStack';
import { ApplicationRequest } from '../../types';
import { ApplicationConnections } from '../application/ApplicationConnections';
import { ApplicationForm } from '../application/ApplicationForm';
import Modal from '../common/Modal';

import DatabaseConnectionModal from './DatabaseConnectionModal';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ApplicationRequest) => Promise<void>;
  application?: ApplicationRequest & { id?: string; connections?: any[] };
  mode?: 'create' | 'edit';
}

const ApplicationModal: React.FC<ApplicationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  application,
  mode = 'create'
}) => {
  // Register this modal with the modal stack
  useModalStack(isOpen, onClose);

  const {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    connections,
    isConnectionFormOpen,
    setIsConnectionFormOpen,
    editingConnection,
    handleFormSubmit,
    handleDeleteConnection,
    toggleConnectionStatus,
    handleEditConnection,
    handleCloseConnectionModal,
    handleConnectionSubmit
  } = useApplicationModal({
    isOpen,
    application,
    mode,
    onSubmit,
    onClose
  });

  if (!isOpen) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={mode === 'create' ? 'Create New Application' : 'Edit Application'}
      size="xl"
    >

          <div className="grid grid-cols-2 gap-6">
            <form onSubmit={handleSubmit(handleFormSubmit)}>
              <ApplicationForm
                register={register}
                errors={errors}
                isSubmitting={isSubmitting}
                mode={mode}
                onClose={onClose}
              />
            </form>

            <ApplicationConnections
              applicationId={application?.id}
              connections={connections}
              mode={mode}
              onAddConnection={() => setIsConnectionFormOpen(true)}
              onEditConnection={handleEditConnection}
              onToggleStatus={toggleConnectionStatus}
              onDeleteConnection={handleDeleteConnection}
              onConnectionAssigned={() => {
                // Refresh connections after assignment
                window.location.reload(); // Simple refresh for now
              }}
            />
          </div>

          {isConnectionFormOpen && mode === 'edit' && application?.id && (
            <DatabaseConnectionModal
              isOpen={isConnectionFormOpen}
              onClose={handleCloseConnectionModal}
              onSubmit={handleConnectionSubmit}
              applicationId={application.id}
              applicationName={application.Name}
              connection={editingConnection || undefined}
              mode={editingConnection ? 'edit' : 'create'}
            />
          )}
    </Modal>
  );
};

export default ApplicationModal;