import React from 'react';
import { UseFormRegister, FieldErrors, Control, Controller, UseFormWatch } from 'react-hook-form';
import { Cloud, Shield } from 'lucide-react';
import { DatabaseType, ApplicationWithConnectionRequest } from '../../types';
import { FormField, Select } from '../common';
import { useCloudConnectionForm } from '../../hooks/useCloudConnectionForm';
import AWSConnectionFields from './cloud/AWSConnectionFields';
import AzureConnectionFields from './cloud/AzureConnectionFields';
import GoogleConnectionFields from './cloud/GoogleConnectionFields';
import SaaSConnectionFields from './cloud/SaaSConnectionFields';

interface CloudConnectionFormProps {
  register: UseFormRegister<ApplicationWithConnectionRequest>;
  control: Control<ApplicationWithConnectionRequest>;
  errors: FieldErrors<ApplicationWithConnectionRequest>;
  databaseType: DatabaseType;
  watch: UseFormWatch<ApplicationWithConnectionRequest>;
}

const CloudConnectionForm: React.FC<CloudConnectionFormProps> = ({ 
  register, 
  control,
  errors, 
  databaseType,
  watch 
}) => {
  const { getAuthMethodOptions, isAWSProvider, isAzureProvider, isGoogleProvider, isSaaSProvider } = useCloudConnectionForm();
  const authMethod = watch('AuthenticationMethod');

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 pb-4 border-b border-gray-200 dark:border-gray-600">
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <Cloud className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Cloud Connection Settings
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure your cloud provider connection
          </p>
        </div>
      </div>

      <FormField label="Authentication Method" required error={errors.AuthenticationMethod?.message}>
        <Controller
          name="AuthenticationMethod"
          control={control}
          rules={{ required: 'Authentication method is required' }}
          render={({ field }) => (
            <Select
              {...field}
              placeholder="Select authentication method"
              options={getAuthMethodOptions(databaseType)}
              error={!!errors.AuthenticationMethod}
            />
          )}
        />
      </FormField>

      {authMethod && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Security Notice</p>
              <p>All credentials are encrypted and stored securely. Only authorized users can access connection details.</p>
            </div>
          </div>
        </div>
      )}

      {isAWSProvider(databaseType) && authMethod && (
        <AWSConnectionFields
          register={register}
          errors={errors}
          databaseType={databaseType}
          authMethod={authMethod}
        />
      )}

      {isAzureProvider(databaseType) && authMethod && (
        <AzureConnectionFields
          register={register}
          errors={errors}
          databaseType={databaseType}
          authMethod={authMethod}
        />
      )}

      {isGoogleProvider(databaseType) && authMethod && (
        <GoogleConnectionFields
          register={register}
          errors={errors}
          databaseType={databaseType}
          authMethod={authMethod}
        />
      )}

      {isSaaSProvider(databaseType) && authMethod && (
        <SaaSConnectionFields
          register={register}
          errors={errors}
          databaseType={databaseType}
          authMethod={authMethod}
        />
      )}
    </div>
  );
};

export default CloudConnectionForm;