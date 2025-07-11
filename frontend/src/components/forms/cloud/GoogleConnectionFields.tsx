import React from 'react';

import { UseFormRegister, FieldErrors } from 'react-hook-form';

import { DatabaseType, AuthenticationMethod, ApplicationWithConnectionRequest } from '../../../types';
import { FormField, Input, Textarea } from '../../common';

interface GoogleConnectionFieldsProps {
  register: UseFormRegister<ApplicationWithConnectionRequest>;
  errors: FieldErrors<ApplicationWithConnectionRequest>;
  databaseType: DatabaseType;
  authMethod: AuthenticationMethod;
}

const GoogleConnectionFields: React.FC<GoogleConnectionFieldsProps> = ({
  register,
  errors,
  databaseType,
  authMethod
}) => {
  return (
    <>
      <FormField label="Project ID" required error={errors.ProjectId?.message}>
        <Input
          {...register('ProjectId', { required: 'Project ID is required' })}
          placeholder="Google Cloud Project ID"
          error={!!errors.ProjectId}
        />
      </FormField>

      <FormField label="Region" required error={errors.Region?.message}>
        <Input
          {...register('Region', { required: 'Region is required' })}
          placeholder="e.g., us-central1"
          error={!!errors.Region}
        />
      </FormField>

      {authMethod === AuthenticationMethod.Google_OAuth && (
        <>
          <FormField label="Client ID" required error={errors.ClientId?.message}>
            <Input
              {...register('ClientId', { required: 'Client ID is required' })}
              placeholder="Google OAuth Client ID"
              error={!!errors.ClientId}
            />
          </FormField>

          <FormField label="Client Secret" required error={errors.ClientSecret?.message}>
            <Input
              {...register('ClientSecret', { required: 'Client Secret is required' })}
              type="password"
              placeholder="Google OAuth Client Secret"
              error={!!errors.ClientSecret}
            />
          </FormField>
        </>
      )}

      {authMethod === AuthenticationMethod.JWT && (
        <FormField label="Service Account Key" required error={errors.ServiceAccountKey?.message}>
          <Textarea
            {...register('ServiceAccountKey', { required: 'Service Account Key is required' })}
            placeholder="Paste the service account JSON key"
            rows={6}
            error={!!errors.ServiceAccountKey}
          />
        </FormField>
      )}

      {authMethod === AuthenticationMethod.ApiKey && (
        <FormField label="API Key" required error={errors.ApiKey?.message}>
          <Input
            {...register('ApiKey', { required: 'API Key is required' })}
            type="password"
            placeholder="Google Cloud API Key"
            error={!!errors.ApiKey}
          />
        </FormField>
      )}

      {databaseType === DatabaseType.Google_CloudSQL && (
        <>
          <FormField label="Instance ID" required error={errors.InstanceId?.message}>
            <Input
              {...register('InstanceId', { required: 'Instance ID is required' })}
              placeholder="Cloud SQL instance ID"
              error={!!errors.InstanceId}
            />
          </FormField>

          <FormField label="Database Name" error={errors.Database?.message}>
            <Input
              {...register('Database')}
              placeholder="Database name"
              error={!!errors.Database}
            />
          </FormField>
        </>
      )}

      {databaseType === DatabaseType.Google_Firestore && (
        <FormField label="Database ID" error={errors.Database?.message}>
          <Input
            {...register('Database')}
            placeholder="Firestore database ID (default: (default))"
            error={!!errors.Database}
          />
        </FormField>
      )}

      {databaseType === DatabaseType.Google_BigQuery && (
        <FormField label="Dataset ID" error={errors.Database?.message}>
          <Input
            {...register('Database')}
            placeholder="BigQuery dataset ID"
            error={!!errors.Database}
          />
        </FormField>
      )}
    </>
  );
};

export default GoogleConnectionFields;