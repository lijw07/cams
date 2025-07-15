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
    handleConnectionSubmit,
    handleAssignConnection,
    handleUnassignConnection,
    loadConnections,
    hasPendingChanges
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
      <div className="-m-6 -mt-4 p-6 pt-4">
          {hasPendingChanges && mode === 'edit' && (
            <div className="mb-4 p-3 bg-warning-50 border border-warning-200 rounded-lg">
              <p className="text-sm text-warning-800">
                <span className="font-medium">Unsaved changes:</span> New connections and assignment changes will be saved when you click "Save Changes"
              </p>
            </div>
          )}

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
              onConnectionAssigned={handleAssignConnection}
              onConnectionUnassigned={handleUnassignConnection}
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
      </div>
    </Modal>
  );
};

export default ApplicationModal;