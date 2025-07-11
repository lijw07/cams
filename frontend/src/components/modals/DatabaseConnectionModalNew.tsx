import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { DatabaseConnectionRequest, DatabaseType } from '../../types';
import { Modal, Button } from '../common';
import SimpleConnectionForm from '../forms/SimpleConnectionForm';

interface DatabaseConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DatabaseConnectionRequest) => Promise<void>;
  applicationId: string;
  applicationName: string;
}

const DatabaseConnectionModal: React.FC<DatabaseConnectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  applicationId,
  applicationName
}) => {
  const [selectedDbType, setSelectedDbType] = useState<DatabaseType>(DatabaseType.SqlServer);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors, isSubmitting }
  } = useForm<DatabaseConnectionRequest>({
    defaultValues: {
      ApplicationId: applicationId,
      Name: '',
      Description: '',
      Type: DatabaseType.SqlServer,
      Server: '',
      Port: undefined,
      Database: '',
      Username: '',
      Password: '',
      ConnectionString: '',
      ApiBaseUrl: '',
      ApiKey: '',
      AdditionalSettings: '',
      IsActive: true
    }
  });

  const watchedDbType = watch('Type');

  useEffect(() => {
    setSelectedDbType(watchedDbType);
  }, [watchedDbType]);

  useEffect(() => {
    if (isOpen) {
      reset({
        ApplicationId: applicationId,
        Name: '',
        Description: '',
        Type: DatabaseType.SqlServer,
        Server: '',
        Port: undefined,
        Database: '',
        Username: '',
        Password: '',
        ConnectionString: '',
        ApiBaseUrl: '',
        ApiKey: '',
        AdditionalSettings: '',
        IsActive: true
      });
    }
  }, [isOpen, applicationId, reset]);

  const handleFormSubmit = async (data: DatabaseConnectionRequest) => {
    try {
      const submissionData = {
        ...data,
        Port: data.Port ? parseInt(data.Port.toString()) : undefined
      };
      await onSubmit(submissionData);
      reset();
      onClose();
    } catch (error) {
      console.error('Error submitting database connection:', error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Database Connection"
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <SimpleConnectionForm
          register={register}
          control={control as any}
          errors={errors}
          selectedDbType={selectedDbType}
          onDbTypeChange={setSelectedDbType}
          applicationName={applicationName}
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            Add Connection
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DatabaseConnectionModal;