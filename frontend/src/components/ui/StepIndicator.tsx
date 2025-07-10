import React from 'react';

interface Step {
  number: number;
  label: string;
  completed: boolean;
  active: boolean;
}

interface StepIndicatorProps {
  steps: Step[];
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ steps }) => {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step.completed || step.active 
                ? 'bg-primary-600 text-white' 
                : 'bg-secondary-300 dark:bg-secondary-600 text-secondary-600 dark:text-secondary-400'
            }`}>
              {step.number}
            </div>
            <span className="ml-2 text-sm font-medium text-secondary-900 dark:text-white">
              {step.label}
            </span>
          </div>
          
          {index < steps.length - 1 && (
            <div className="flex-1 h-1 mx-4 bg-secondary-200 dark:bg-secondary-700">
              <div className={`h-full ${
                steps[index + 1].completed || steps[index + 1].active 
                  ? 'bg-primary-600' 
                  : 'bg-secondary-300 dark:bg-secondary-600'
              } transition-all`} />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default StepIndicator;