import React from 'react';
import ProfileInfo from '../components/profile/ProfileInfo';
import PasswordChange from '../components/profile/PasswordChange';

const Profile: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
          Account Settings
        </h1>
        <p className="text-secondary-600 dark:text-secondary-400 mt-2">
          Manage your account information and security settings
        </p>
      </div>

      <div className="space-y-8">
        <ProfileInfo />
        <PasswordChange />
      </div>
    </div>
  );
};

export default Profile;