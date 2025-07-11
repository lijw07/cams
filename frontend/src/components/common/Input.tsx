import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  error = false,
  fullWidth = true,
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'flex h-10 rounded-lg border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-secondary-500 dark:placeholder:text-secondary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
  
  const errorClasses = error 
    ? 'border-error-300 dark:border-error-600 bg-error-50 dark:bg-error-900/20 text-error-900 dark:text-error-100 focus-visible:ring-error-500'
    : 'border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus-visible:ring-primary-500';
  
  const widthClasses = fullWidth ? 'w-full' : '';
  
  const classes = `${baseClasses} ${errorClasses} ${widthClasses} ${className}`;

  return (
    <input
      ref={ref}
      className={classes}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export default Input;