import React from 'react';

import { User, Edit, Save, X, Shield } from 'lucide-react';

interface ProfileFormProps {
  user: any;
  isEditing: boolean;
  isLoading: boolean;
  formData: {
    FirstName: string;
    LastName: string;
    PhoneNumber: string;
  };
  onEditClick: () => void;
  onCancelClick: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSaveClick: () => void;
  onPasswordChangeClick: () => void;
  hasChanges: () => boolean;
  isValidPhoneNumber: (phone: string) => boolean;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
  user,
  isEditing,
  isLoading,
  formData,
  onEditClick,
  onCancelClick,
  onInputChange,
  onSaveClick,
  onPasswordChangeClick,
  hasChanges,
  isValidPhoneNumber
}) => {
  if (!user) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your account information and preferences</p>
        </div>
        {!isEditing ? (
          <button 
            onClick={onEditClick}
            className="btn btn-primary"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </button>
        ) : (
          <div className="flex space-x-2">
            <button 
              onClick={onCancelClick}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </button>
            <button 
              onClick={onSaveClick}
              className="btn btn-primary"
              disabled={isLoading || !hasChanges() || !isValidPhoneNumber(formData.PhoneNumber)}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-secondary-800 shadow rounded-lg p-6">
        <div className="flex items-center mb-6">
          <div className="h-20 w-20 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
            <User className="h-10 w-10 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="ml-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {user.Username}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">{user.Email}</p>
            <div className="flex items-center mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.IsActive 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {user.IsActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">First Name</dt>
              <dd className="mt-1">
                {isEditing ? (
                  <input
                    type="text"
                    name="FirstName"
                    value={formData.FirstName}
                    onChange={onInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-secondary-700 text-gray-900 dark:text-white"
                    placeholder="Enter first name"
                  />
                ) : (
                  <p className="text-sm text-gray-900 dark:text-white">
                    {formData.FirstName || 'Not provided'}
                  </p>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Name</dt>
              <dd className="mt-1">
                {isEditing ? (
                  <input
                    type="text"
                    name="LastName"
                    value={formData.LastName}
                    onChange={onInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-secondary-700 text-gray-900 dark:text-white"
                    placeholder="Enter last name"
                  />
                ) : (
                  <p className="text-sm text-gray-900 dark:text-white">
                    {formData.LastName || 'Not provided'}
                  </p>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone Number</dt>
              <dd className="mt-1">
                {isEditing ? (
                  <div>
                    <input
                      type="tel"
                      name="PhoneNumber"
                      value={formData.PhoneNumber}
                      onChange={onInputChange}
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm bg-white dark:bg-secondary-700 text-gray-900 dark:text-white ${
                        formData.PhoneNumber && !isValidPhoneNumber(formData.PhoneNumber)
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Enter phone number"
                    />
                    {formData.PhoneNumber && !isValidPhoneNumber(formData.PhoneNumber) && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        Please enter a valid phone number
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-900 dark:text-white">
                    {formData.PhoneNumber || 'Not provided'}
                  </p>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Member Since</dt>
              <dd className="mt-1">
                <p className="text-sm text-gray-900 dark:text-white">
                  {new Date(user.CreatedAt).toLocaleDateString()}
                </p>
              </dd>
            </div>
          </dl>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
          <button
            onClick={onPasswordChangeClick}
            className="btn btn-secondary"
          >
            <Shield className="w-4 h-4 mr-2" />
            Change Password
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;