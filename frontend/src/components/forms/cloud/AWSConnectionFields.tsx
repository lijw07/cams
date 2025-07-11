import React from 'react';

import { UseFormRegister, FieldErrors } from 'react-hook-form';

import { DatabaseType, AuthenticationMethod, ApplicationWithConnectionRequest } from '../../../types';
import { FormField, Input } from '../../common';

interface AWSConnectionFieldsProps {
  register: UseFormRegister<ApplicationWithConnectionRequest>;
  errors: FieldErrors<ApplicationWithConnectionRequest>;
  databaseType: DatabaseType;
  authMethod: AuthenticationMethod;
}

const AWSConnectionFields: React.FC<AWSConnectionFieldsProps> = ({
  register,
  errors,
  databaseType,
  authMethod
}) => {
  return (
    <>
      <FormField label="Region" required error={errors.Region?.message}>
        <Input
          {...register('Region', { required: 'Region is required' })}
          placeholder="e.g., us-east-1"
          error={!!errors.Region}
        />
      </FormField>

      {authMethod === AuthenticationMethod.AWS_IAM && (
        <>
          <FormField label="Account ID" error={errors.AccountId?.message}>
            <Input
              {...register('AccountId')}
              placeholder="AWS Account ID"
              error={!!errors.AccountId}
            />
          </FormField>

          <FormField label="Session Token" error={errors.SessionToken?.message}>
            <Input
              {...register('SessionToken')}
              type="password"
              placeholder="Optional session token"
              error={!!errors.SessionToken}
            />
          </FormField>
        </>
      )}

      {authMethod === AuthenticationMethod.BasicAuth && (
        <>
          <FormField label="Access Key ID" required error={errors.AccessKeyId?.message}>
            <Input
              {...register('AccessKeyId', { required: 'Access Key ID is required' })}
              placeholder="AWS Access Key ID"
              error={!!errors.AccessKeyId}
            />
          </FormField>

          <FormField label="Secret Access Key" required error={errors.SecretAccessKey?.message}>
            <Input
              {...register('SecretAccessKey', { required: 'Secret Access Key is required' })}
              type="password"
              placeholder="AWS Secret Access Key"
              error={!!errors.SecretAccessKey}
            />
          </FormField>
        </>
      )}

      {databaseType === DatabaseType.AWS_RDS && (
        <FormField label="Instance Identifier" error={errors.InstanceId?.message}>
          <Input
            {...register('InstanceId')}
            placeholder="RDS instance identifier"
            error={!!errors.InstanceId}
          />
        </FormField>
      )}

      {databaseType === DatabaseType.AWS_DynamoDB && (
        <FormField label="Table Name" error={errors.Database?.message}>
          <Input
            {...register('Database')}
            placeholder="DynamoDB table name"
            error={!!errors.Database}
          />
        </FormField>
      )}

      {databaseType === DatabaseType.AWS_S3 && (
        <FormField label="Bucket Name" error={errors.Database?.message}>
          <Input
            {...register('Database')}
            placeholder="S3 bucket name"
            error={!!errors.Database}
          />
        </FormField>
      )}
    </>
  );
};

export default AWSConnectionFields;