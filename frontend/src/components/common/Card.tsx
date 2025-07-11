import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'danger' | 'warning' | 'success' | 'info';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  padding = 'md'
}) => {
  const baseClasses = 'rounded-lg border bg-white dark:bg-secondary-800 shadow-soft';
  
  const variantClasses = {
    default: 'border-secondary-200 dark:border-secondary-700',
    danger: 'border-l-4 border-l-error-500 border-secondary-200 dark:border-secondary-700',
    warning: 'border-l-4 border-l-warning-500 border-secondary-200 dark:border-secondary-700',
    success: 'border-l-4 border-l-success-500 border-secondary-200 dark:border-secondary-700',
    info: 'border-l-4 border-l-primary-500 border-secondary-200 dark:border-secondary-700'
  };

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`;

  return (
    <div className={classes}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`flex flex-col space-y-1.5 pb-6 ${className}`}>
    {children}
  </div>
);

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <h3 className={`text-lg font-semibold text-secondary-900 dark:text-white ${className}`}>
    {children}
  </h3>
);

export const CardDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <p className={`text-sm text-secondary-600 dark:text-secondary-400 ${className}`}>
    {children}
  </p>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={className}>
    {children}
  </div>
);

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`flex items-center pt-6 ${className}`}>
    {children}
  </div>
);

export default Card;