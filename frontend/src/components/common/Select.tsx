import React, { forwardRef, useMemo } from 'react';

import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  fullWidth?: boolean;
  options: SelectOption[];
  placeholder?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  error = false,
  fullWidth = true,
  options,
  placeholder,
  className = '',
  'aria-invalid': ariaInvalid,
  ...props
}, ref) => {
  const baseClasses = 'flex h-10 rounded-lg border px-3 py-2 text-sm bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer';
  
  const errorClasses = error 
    ? 'border-error-300 dark:border-error-600 bg-error-50 dark:bg-error-900/20 text-error-900 dark:text-error-100 focus-visible:ring-error-500'
    : 'border-secondary-300 dark:border-secondary-600 focus-visible:ring-primary-500';
  
  const widthClasses = fullWidth ? 'w-full' : '';
  
  const classes = `${baseClasses} ${errorClasses} ${widthClasses} ${className}`;

  // Memoize option rendering to prevent recreation on every render
  const optionElements = useMemo(() => 
    options.map((option) => (
      <option 
        key={option.value} 
        value={option.value}
        disabled={option.disabled}
      >
        {option.label}
      </option>
    )), [options]);

  return (
    <div className="relative">
      <select
        ref={ref}
        className={classes}
        aria-invalid={ariaInvalid ?? error}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {optionElements}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-500 pointer-events-none" aria-hidden="true" />
    </div>
  );
});

Select.displayName = 'Select';

export default Select;