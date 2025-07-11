import React from 'react';

import PasswordChangeModal from '../components/profile/PasswordChangeModal';
import ProfileForm from '../components/profile/ProfileForm';
import { usePasswordChange } from '../hooks/usePasswordChange';
import { useProfile } from '../hooks/useProfile';

const Profile: React.FC = () => {
  const profileHook = useProfile();
  const passwordHook = usePasswordChange();

  return (
    <>
      <ProfileForm
        user={profileHook.user}
        isEditing={profileHook.isEditing}
        isLoading={profileHook.isLoading}
        formData={profileHook.formData}
        onEditClick={profileHook.handleEditClick}
        onCancelClick={profileHook.handleCancelClick}
        onInputChange={profileHook.handleInputChange}
        onSaveClick={profileHook.handleSaveClick}
        onPasswordChangeClick={() => passwordHook.setShowPasswordModal(true)}
        hasChanges={profileHook.hasChanges}
        isValidPhoneNumber={profileHook.isValidPhoneNumber}
      />
      
      <PasswordChangeModal
        isOpen={passwordHook.showPasswordModal}
        onClose={passwordHook.handleClosePasswordModal}
        passwordForm={passwordHook.passwordForm}
        showPasswords={passwordHook.showPasswords}
        passwordLoading={passwordHook.passwordLoading}
        onPasswordChange={passwordHook.handlePasswordChange}
        onTogglePasswordVisibility={passwordHook.togglePasswordVisibility}
        onPasswordSubmit={passwordHook.handlePasswordSubmit}
        validatePassword={passwordHook.validatePassword}
      />
    </>
  );
};

export default Profile;