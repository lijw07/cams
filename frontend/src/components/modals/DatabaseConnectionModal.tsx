import React from 'react';

import { X, Database } from 'lucide-react';

import { useDatabaseConnectionModal } from '../../hooks/useDatabaseConnectionModal';
import { DatabaseConnectionRequest, DatabaseConnectionUpdateRequest, DatabaseConnection } from '../../types';
import { DatabaseConnectionFields } from '../forms/DatabaseConnectionFields';

interface DatabaseConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DatabaseConnectionRequest | DatabaseConnectionUpdateRequest) => Promise<void>;
  applicationId: string;
  applicationName: string;
  connection?: DatabaseConnection;
  mode?: 'create' | 'edit';
}

const DatabaseConnectionModal: React.FC<DatabaseConnectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  applicationId,
  applicationName,
  connection,
  mode = 'create'
}) => {
  const {
    register,
    handleSubmit,
    control,
    errors,
    isSubmitting,
    selectedDbType,
    setSelectedDbType,
    handleFormSubmit,
    handleClose,
    getDatabaseTypeOptions,
    isApiType,
    isConnectionStringType
  } = useDatabaseConnectionModal({
    isOpen,
    applicationId,
    connection,
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
          onClick={handleClose}
        />

        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === 'edit' ? 'Edit Database Connection' : 'Add Database Connection'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {mode === 'edit' 
                  ? `Editing: ${connection?.Name}` 
                  : `Adding connection to: ${applicationName}`
                }
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Connection Details
              </h3>

              <DatabaseConnectionFields
                register={register}
                errors={errors}
                control={control}
                selectedDbType={selectedDbType}
                setSelectedDbType={setSelectedDbType}
                getDatabaseTypeOptions={getDatabaseTypeOptions}
                isApiType={isApiType}
                isConnectionStringType={isConnectionStringType}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-outline"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? (mode === 'edit' ? 'Updating...' : 'Creating...') 
                  : (mode === 'edit' ? 'Update Connection' : 'Add Connection')
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DatabaseConnectionModal;