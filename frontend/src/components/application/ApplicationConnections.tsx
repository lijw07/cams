import React, { useState, useEffect } from 'react';

import { Database, Plus, Edit, ToggleLeft, ToggleRight, Trash2, Link } from 'lucide-react';

import { DatabaseConnection, DatabaseConnectionSummary } from '../../types';
import { databaseConnectionService } from '../../services/databaseConnectionService';

interface ApplicationConnectionsProps {
  applicationId?: string;
  connections: DatabaseConnection[];
  mode: 'create' | 'edit';
  onAddConnection: () => void;
  onEditConnection: (connection: DatabaseConnection) => void;
  onToggleStatus: (connectionId: string, currentStatus: boolean) => void;
  onDeleteConnection: (connectionId: string) => void;
  onConnectionAssigned?: () => void;
}

export const ApplicationConnections: React.FC<ApplicationConnectionsProps> = ({
  applicationId,
  connections,
  mode,
  onAddConnection,
  onEditConnection,
  onToggleStatus,
  onDeleteConnection,
  onConnectionAssigned
}) => {
  const [unassignedConnections, setUnassignedConnections] = useState<DatabaseConnectionSummary[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [isLoadingUnassigned, setIsLoadingUnassigned] = useState(false);

  const loadUnassignedConnections = async () => {
    if (mode === 'create') return;
    
    setIsLoadingUnassigned(true);
    try {
      const unassigned = await databaseConnectionService.getUnassignedConnections();
      setUnassignedConnections(unassigned);
    } catch (error) {
      console.error('Error loading unassigned connections:', error);
    } finally {
      setIsLoadingUnassigned(false);
    }
  };

  useEffect(() => {
    loadUnassignedConnections();
  }, [mode]);

  const handleAssignConnection = async (connectionId: string) => {
    if (!applicationId) return;

    try {
      await databaseConnectionService.assignConnectionToApplication(connectionId, applicationId);
      await loadUnassignedConnections();
      onConnectionAssigned?.();
      setShowAssignModal(false);
    } catch (error) {
      console.error('Error assigning connection:', error);
    }
  };

  const handleUnassignConnection = async (connectionId: string) => {
    try {
      await databaseConnectionService.unassignConnectionFromApplication(connectionId);
      await loadUnassignedConnections();
      onConnectionAssigned?.();
    } catch (error) {
      console.error('Error unassigning connection:', error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Database className="w-5 h-5 mr-2" />
          Database Connections
        </h3>
        <div className="flex space-x-2">
          {mode === 'edit' && unassignedConnections.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAssignModal(true)}
              className="btn btn-secondary btn-sm"
            >
              <Link className="w-4 h-4 mr-2" />
              Assign Existing
            </button>
          )}
          <button
            type="button"
            onClick={onAddConnection}
            className="btn btn-primary btn-sm"
            disabled={mode === 'create'}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Connection
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {mode === 'create' ? (
          <EmptyStateMessage 
            message="Create the application first"
            submessage="You can add connections after creating the application"
          />
        ) : connections.length === 0 ? (
          <EmptyStateMessage 
            message="No database connections yet"
            submessage="Click 'Add Connection' to create one or 'Assign Existing' to use existing connections"
          />
        ) : (
          connections.map((connection) => (
            <ConnectionCard
              key={connection.Id}
              connection={connection}
              onEdit={onEditConnection}
              onToggleStatus={onToggleStatus}
              onDelete={onDeleteConnection}
              onUnassign={() => handleUnassignConnection(connection.Id)}
              showUnassign={mode === 'edit'}
            />
          ))
        )}
      </div>

      {/* Assign Existing Connection Modal */}
      {showAssignModal && (
        <AssignConnectionModal
          unassignedConnections={unassignedConnections}
          isLoading={isLoadingUnassigned}
          onAssign={handleAssignConnection}
          onClose={() => setShowAssignModal(false)}
        />
      )}
    </div>
  );
};

const EmptyStateMessage: React.FC<{ message: string; submessage: string }> = ({ 
  message, 
  submessage 
}) => (
  <div className="text-center py-8 text-gray-500">
    <Database className="w-12 h-12 mx-auto mb-2 text-gray-300" />
    <p>{message}</p>
    <p className="text-sm">{submessage}</p>
  </div>
);

const ConnectionCard: React.FC<{
  connection: DatabaseConnection;
  onEdit: (connection: DatabaseConnection) => void;
  onToggleStatus: (connectionId: string, currentStatus: boolean) => void;
  onDelete: (connectionId: string) => void;
  onUnassign?: () => void;
  showUnassign?: boolean;
}> = ({ connection, onEdit, onToggleStatus, onDelete, onUnassign, showUnassign }) => (
  <div 
    className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-colors"
    onClick={() => onEdit(connection)}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-2">
          <h4 className="font-medium text-gray-900">{connection.Name}</h4>
          <span className={`badge ${connection.IsActive ? 'badge-success' : 'badge-secondary'}`}>
            {connection.IsActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-2">{connection.TypeName}</p>
        {connection.Description && (
          <p className="text-sm text-gray-500 mb-2">{connection.Description}</p>
        )}
        <div className="text-xs text-gray-400">
          Created: {new Date(connection.CreatedAt).toLocaleDateString()}
        </div>
      </div>
      <div className="flex space-x-2 ml-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(connection);
          }}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          title="Edit"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleStatus(connection.Id, connection.IsActive);
          }}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          title={connection.IsActive ? 'Deactivate' : 'Activate'}
        >
          {connection.IsActive ? (
            <ToggleRight className="w-4 h-4 text-success-600" />
          ) : (
            <ToggleLeft className="w-4 h-4" />
          )}
        </button>
        {showUnassign && onUnassign && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUnassign();
            }}
            className="p-1 rounded-md text-gray-400 hover:text-warning-600 hover:bg-warning-50"
            title="Unassign from Application"
          >
            <Link className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(connection.Id);
          }}
          className="p-1 rounded-md text-gray-400 hover:text-error-600 hover:bg-error-50"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
);

const AssignConnectionModal: React.FC<{
  unassignedConnections: DatabaseConnectionSummary[];
  isLoading: boolean;
  onAssign: (connectionId: string) => void;
  onClose: () => void;
}> = ({ unassignedConnections, isLoading, onAssign, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Assign Existing Connection</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      <div className="overflow-y-auto max-h-96">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading connections...</p>
          </div>
        ) : unassignedConnections.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Database className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No unassigned connections available</p>
            <p className="text-sm">All your connections are already assigned to applications</p>
          </div>
        ) : (
          <div className="space-y-3">
            {unassignedConnections.map((connection) => (
              <div
                key={connection.Id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => onAssign(connection.Id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-gray-900">{connection.Name}</h4>
                      <span className={`badge ${connection.IsActive ? 'badge-success' : 'badge-secondary'}`}>
                        {connection.IsActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{connection.TypeName || connection.Type}</p>
                    {connection.Description && (
                      <p className="text-sm text-gray-500 mb-2">{connection.Description}</p>
                    )}
                    <div className="text-xs text-gray-400">
                      Server: {connection.Server} {connection.Port && `:${connection.Port}`}
                    </div>
                  </div>
                  <button className="btn btn-sm btn-primary">
                    Assign
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end mt-4 pt-4 border-t">
        <button
          onClick={onClose}
          className="btn btn-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);