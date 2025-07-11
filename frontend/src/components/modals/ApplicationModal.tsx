import React from 'react';

import { X } from 'lucide-react';

import { useApplicationModal } from '../../hooks/useApplicationModal';
import { ApplicationRequest } from '../../types';
import { ApplicationConnections } from '../application/ApplicationConnections';
import { ApplicationForm } from '../application/ApplicationForm';

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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {mode === 'create' ? 'Create New Application' : 'Edit Application'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <form onSubmit={handleSubmit(handleFormSubmit)}>
              <ApplicationForm
                register={register}
                errors={errors}
                isSubmitting={isSubmitting}
                mode={mode}
              />
            </form>

            <ApplicationConnections
              connections={connections}
              mode={mode}
              onAddConnection={() => setIsConnectionFormOpen(true)}
              onEditConnection={handleEditConnection}
              onToggleStatus={toggleConnectionStatus}
              onDeleteConnection={handleDeleteConnection}
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
      </div>
    </div>
  );
};

export default ApplicationModal;