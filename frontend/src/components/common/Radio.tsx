import React, { forwardRef } from 'react';

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: boolean;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: boolean;
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

const Radio = forwardRef<HTMLInputElement, RadioProps>(({
  label,
  error = false,
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'h-4 w-4 rounded-full border-2 focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
  
  const errorClasses = error
    ? 'border-error-300 dark:border-error-600 text-error-600 focus:ring-error-500'
    : 'border-secondary-300 dark:border-secondary-600 text-primary-600 focus:ring-primary-500';

  const radioClasses = `${baseClasses} ${errorClasses} ${className}`;

  if (label) {
    return (
      <div className="flex items-center space-x-2">
        <div className="relative">
          <input
            ref={ref}
            type="radio"
            className={`${radioClasses} sr-only`}
            {...props}
          />
          <div className={`${baseClasses} ${errorClasses} flex items-center justify-center bg-white dark:bg-secondary-800 cursor-pointer ${props.checked ? 'bg-primary-600 border-primary-600' : ''}`}>
            {props.checked && (
              <div className="h-2 w-2 rounded-full bg-white" />
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
        type="radio"
        className={`${radioClasses} sr-only`}
        {...props}
      />
      <div className={`${baseClasses} ${errorClasses} flex items-center justify-center bg-white dark:bg-secondary-800 cursor-pointer ${props.checked ? 'bg-primary-600 border-primary-600' : ''}`}>
        {props.checked && (
          <div className="h-2 w-2 rounded-full bg-white" />
        )}
      </div>
    </div>
  );
});

Radio.displayName = 'Radio';

// RadioGroup component for managing multiple radio buttons
export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  options,
  value,
  onChange,
  error = false,
  direction = 'vertical',
  className = ''
}) => {
  const containerClasses = direction === 'horizontal' 
    ? 'flex flex-wrap gap-4' 
    : 'space-y-2';

  return (
    <div className={`${containerClasses} ${className}`}>
      {options.map((option) => (
        <Radio
          key={option.value}
          name={name}
          value={option.value}
          checked={value === option.value}
          onChange={() => onChange?.(option.value)}
          disabled={option.disabled}
          error={error}
          label={option.label}
        />
      ))}
    </div>
  );
};

export default Radio;