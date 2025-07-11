import React from 'react';

import { ArrowLeft, User, Power, Trash2 } from 'lucide-react';

interface EditUserHeaderProps {
  user: any;
  isDeleting: boolean;
  onBack: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}

export const EditUserHeader: React.FC<EditUserHeaderProps> = ({
  user,
  isDeleting,
  onBack,
  onToggleStatus,
  onDelete
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <User className="w-6 h-6" />
            Edit User
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Update user information and roles</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleStatus}
          className={`btn ${user.IsActive ? 'btn-secondary' : 'btn-success'}`}
        >
          <Power className="w-4 h-4 mr-2" />
          {user.IsActive ? 'Deactivate' : 'Activate'}
        </button>
        <button
          onClick={onDelete}
          className="btn btn-error"
          disabled={isDeleting}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </button>
      </div>
    </div>
  );
};