import React, { useState, useEffect } from 'react';
import { Database, Plus, Edit, ToggleLeft, ToggleRight, Trash2, Link, Unlink } from 'lucide-react';
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
  onConnectionAssigned?: (connectionId: string, connectionData: DatabaseConnectionSummary) => void;
  onConnectionUnassigned?: (connectionId: string) => void;
}

export const ApplicationConnections: React.FC<ApplicationConnectionsProps> = ({
  applicationId,
  connections,
  mode,
  onAddConnection,
  onEditConnection,
  onToggleStatus,
  onDeleteConnection,
  onConnectionAssigned,
  onConnectionUnassigned
}) => {
  const [availableConnections, setAvailableConnections] = useState<DatabaseConnectionSummary[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);

  const loadAvailableConnections = async () => {
    if (mode === 'create') return;
    
    setIsLoadingAvailable(true);
    try {
      const allConnections = await databaseConnectionService.getConnectionsSummary();
      const currentConnectionIds = connections.map(c => c.Id);
      const available = allConnections.filter(c => !currentConnectionIds.includes(c.Id));
      setAvailableConnections(available);
    } catch (error) {
      console.error('Error loading available connections:', error);
    } finally {
      setIsLoadingAvailable(false);
    }
  };

  useEffect(() => {
    loadAvailableConnections();
  }, [mode, connections]);

  const handleAssignConnection = async (connectionId: string) => {
    if (!applicationId) return;

    const connectionData = availableConnections.find(c => c.Id === connectionId);
    if (!connectionData || !onConnectionAssigned) return;

    if (connectionData.ApplicationId) {
      const confirmed = confirm(
        'This connection is currently assigned to another application. ' +
        'Assigning it here will remove it from the other application. ' +
        'Do you want to continue?'
      );
      if (!confirmed) return;
    }

    onConnectionAssigned(connectionId, connectionData);
    setAvailableConnections(prev => prev.filter(c => c.Id !== connectionId));
    setShowAssignModal(false);
  };

  const handleUnassignConnection = async (connectionId: string) => {
    if (onConnectionUnassigned) {
      onConnectionUnassigned(connectionId);
      await loadAvailableConnections();
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
          {mode === 'edit' && (
            <button
              type="button"
              onClick={() => setShowAssignModal(true)}
              className="btn btn-secondary btn-sm"
              title={availableConnections.length === 0 ? "No other connections available" : "Assign existing database connection"}
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
            Add New Connection
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {mode === 'create' ? (
          <EmptyStateMessage 
            message="Create the application first"
            submessage="You can add connections after creating the application"
          />
        ) : connections.length === 0 ? (
          <EmptyStateMessage 
            message="No database connections yet"
            submessage="Click 'Add New Connection' to create one or 'Assign Existing' to use available connections"
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

      {showAssignModal && (
        <AssignConnectionModal
          availableConnections={availableConnections}
          isLoading={isLoadingAvailable}
          onAssign={handleAssignConnection}
          onClose={() => setShowAssignModal(false)}
        />
      )}
    </div>
  );
};

interface EmptyStateMessageProps {
  message: string;
  submessage: string;
}

const EmptyStateMessage: React.FC<EmptyStateMessageProps> = ({ message, submessage }) => {
  return (
    <div className="text-center py-8 text-gray-500">
      <Database className="w-12 h-12 mx-auto mb-2 text-gray-300" />
      <p>{message}</p>
      <p className="text-sm">{submessage}</p>
    </div>
  );
};

interface ConnectionCardProps {
  connection: DatabaseConnection;
  onEdit: (connection: DatabaseConnection) => void;
  onToggleStatus: (connectionId: string, currentStatus: boolean) => void;
  onDelete: (connectionId: string) => void;
  onUnassign?: () => void;
  showUnassign?: boolean;
}

const ConnectionCard: React.FC<ConnectionCardProps> = ({ 
  connection, 
  onEdit, 
  onToggleStatus, 
  onDelete, 
  onUnassign, 
  showUnassign = false 
}) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between">
        <div 
          className="flex-1 cursor-pointer"
          onClick={() => onEdit(connection)}
        >
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
        <div className="flex flex-col items-end space-y-2 ml-4">
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(connection);
              }}
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Edit Connection"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus(connection.Id, connection.IsActive);
              }}
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title={connection.IsActive ? 'Deactivate' : 'Activate'}
            >
              {connection.IsActive ? (
                <ToggleRight className="w-4 h-4 text-success-600" />
              ) : (
                <ToggleLeft className="w-4 h-4" />
              )}
            </button>
            {showUnassign && onUnassign && (
              <>
                <div className="w-px h-5 bg-gray-200 mx-1" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to unassign this connection from the application? It will remain available for other applications to use.')) {
                      onUnassign();
                    }
                  }}
                  className="p-1.5 rounded-md text-warning-500 hover:text-warning-600 hover:bg-warning-50 transition-colors"
                  title="Unassign from Application"
                >
                  <Unlink className="w-4 h-4" />
                </button>
              </>
            )}
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(connection.Id);
              }}
              className="p-1.5 rounded-md text-error-500 hover:text-error-600 hover:bg-error-50 transition-colors"
              title="Delete Connection"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface AssignConnectionModalProps {
  availableConnections: DatabaseConnectionSummary[];
  isLoading: boolean;
  onAssign: (connectionId: string) => void;
  onClose: () => void;
}

const AssignConnectionModal: React.FC<AssignConnectionModalProps> = ({ 
  availableConnections, 
  isLoading, 
  onAssign, 
  onClose 
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Available Database Connections</h3>
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
          ) : availableConnections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No available connections</p>
              <p className="text-sm">All connections are already assigned to this application</p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableConnections.map((connection) => (
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
                      {connection.ApplicationId && (
                        <div className="text-xs text-warning-600 mt-1">
                          ⚠️ Currently assigned to another application (will be reassigned)
                        </div>
                      )}
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
};