import React, { forwardRef } from 'react';

import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: boolean;
  indeterminate?: boolean;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
  label,
  error = false,
  indeterminate = false,
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'h-4 w-4 rounded border-2 focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
  
  const errorClasses = error
    ? 'border-error-300 dark:border-error-600 text-error-600 focus:ring-error-500'
    : 'border-secondary-300 dark:border-secondary-600 text-primary-600 focus:ring-primary-500';

  const checkboxClasses = `${baseClasses} ${errorClasses} ${className}`;

  if (label) {
    return (
      <div className="flex items-center space-x-2">
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            className={`${checkboxClasses} sr-only`}
            {...props}
          />
          <div className={`${baseClasses} ${errorClasses} flex items-center justify-center bg-white dark:bg-secondary-800 cursor-pointer ${props.checked || indeterminate ? 'bg-primary-600 border-primary-600' : ''}`}>
            {(props.checked || indeterminate) && (
              <Check className="h-3 w-3 text-white" />
            )}
            {indeterminate && !props.checked && (
              <div className="h-0.5 w-2 bg-white" />
            )}
          </div>
        </div>
        <label 
          className={`text-sm cursor-pointer ${error ? 'text-error-600 dark:text-error-400' : 'text-secondary-700 dark:text-secondary-300'}`}
          onClick={() => {
            if (ref && 'current' in ref && ref.current) {
              ref.current.click();
            }
          }}
        >
          {label}
        </label>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        ref={ref}
        type="checkbox"
        className={`${checkboxClasses} sr-only`}
        {...props}
      />
      <div className={`${baseClasses} ${errorClasses} flex items-center justify-center bg-white dark:bg-secondary-800 cursor-pointer ${props.checked || indeterminate ? 'bg-primary-600 border-primary-600' : ''}`}>
        {(props.checked || indeterminate) && (
          <Check className="h-3 w-3 text-white" />
        )}
        {indeterminate && !props.checked && (
          <div className="h-0.5 w-2 bg-white" />
        )}
      </div>
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;