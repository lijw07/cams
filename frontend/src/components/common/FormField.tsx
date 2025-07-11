import React, { useId, cloneElement, isValidElement } from 'react';

export interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  helpText?: string;
  children: React.ReactNode;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required = false,
  helpText,
  children,
  className = ''
}) => {
  const fieldId = useId();
  const errorId = useId();
  const helpTextId = useId();
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label 
          htmlFor={fieldId}
          className="block text-sm font-medium text-secondary-700 dark:text-secondary-300"
        >
          {label}
          {required && (
            <>
              <span className="text-error-500 ml-1" aria-label="required">*</span>
              <span className="sr-only">required</span>
            </>
          )}
        </label>
      )}
      
      {/* Clone children and add accessibility props */}
      {isValidElement(children) ? cloneElement(children as React.ReactElement<any>, {
        id: fieldId,
        'aria-describedby': [
          error && errorId,
          helpText && !error && helpTextId
        ].filter(Boolean).join(' ') || undefined,
        'aria-invalid': error ? true : undefined,
        'aria-required': required || undefined,
      }) : children}
      
      {error && (
        <p 
          id={errorId}
          role="alert"
          className="text-sm text-error-600 dark:text-error-400"
        >
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p 
          id={helpTextId}
          className="text-sm text-secondary-500 dark:text-secondary-400"
        >
          {helpText}
        </p>
      )}
    </div>
  );
};

export default FormField;