import React from 'react';
import { Database, Plus, Edit, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { DatabaseConnection } from '../../types';

interface ApplicationConnectionsProps {
  connections: DatabaseConnection[];
  mode: 'create' | 'edit';
  onAddConnection: () => void;
  onEditConnection: (connection: DatabaseConnection) => void;
  onToggleStatus: (connectionId: string, currentStatus: boolean) => void;
  onDeleteConnection: (connectionId: string) => void;
}

export const ApplicationConnections: React.FC<ApplicationConnectionsProps> = ({
  connections,
  mode,
  onAddConnection,
  onEditConnection,
  onToggleStatus,
  onDeleteConnection
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Database className="w-5 h-5 mr-2" />
          Database Connections
        </h3>
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

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {mode === 'create' ? (
          <EmptyStateMessage 
            message="Create the application first"
            submessage="You can add connections after creating the application"
          />
        ) : connections.length === 0 ? (
          <EmptyStateMessage 
            message="No database connections yet"
            submessage="Click 'Add Connection' to create one"
          />
        ) : (
          connections.map((connection) => (
            <ConnectionCard
              key={connection.Id}
              connection={connection}
              onEdit={onEditConnection}
              onToggleStatus={onToggleStatus}
              onDelete={onDeleteConnection}
            />
          ))
        )}
      </div>
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
}> = ({ connection, onEdit, onToggleStatus, onDelete }) => (
  <div className="border border-gray-200 rounded-lg p-4">
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
          onClick={() => onEdit(connection)}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          title="Edit"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={() => onToggleStatus(connection.Id, connection.IsActive)}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          title={connection.IsActive ? 'Deactivate' : 'Activate'}
        >
          {connection.IsActive ? (
            <ToggleRight className="w-4 h-4 text-success-600" />
          ) : (
            <ToggleLeft className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={() => onDelete(connection.Id)}
          className="p-1 rounded-md text-gray-400 hover:text-error-600 hover:bg-error-50"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
);