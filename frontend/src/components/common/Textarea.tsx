import React, { forwardRef } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  fullWidth?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  error = false,
  fullWidth = true,
  resize = 'vertical',
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'flex min-h-[80px] rounded-lg border px-3 py-2 text-sm placeholder:text-secondary-500 dark:placeholder:text-secondary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
  
  const errorClasses = error 
    ? 'border-error-300 dark:border-error-600 bg-error-50 dark:bg-error-900/20 text-error-900 dark:text-error-100 focus-visible:ring-error-500'
    : 'border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus-visible:ring-primary-500';
  
  const widthClasses = fullWidth ? 'w-full' : '';
  
  const resizeClasses = {
    none: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x',
    both: 'resize'
  };
  
  const classes = `${baseClasses} ${errorClasses} ${widthClasses} ${resizeClasses[resize]} ${className}`;

  return (
    <textarea
      ref={ref}
      className={classes}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;