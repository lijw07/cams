import React from 'react';

interface TestResultProps {
  success: boolean;
  message: string;
}

const TestResult: React.FC<TestResultProps> = ({ success, message }) => {
  return (
    <div className={`p-4 rounded-md ${
      success 
        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
    }`}>
      <div className="flex items-center">
        <div className={`flex-shrink-0 w-4 h-4 rounded-full ${
          success ? 'bg-green-400' : 'bg-red-400'
        }`} />
        <div className="ml-3">
          <p className={`text-sm font-medium ${
            success 
              ? 'text-green-800 dark:text-green-200' 
              : 'text-red-800 dark:text-red-200'
          }`}>
            {success ? 'Connection Test Passed' : 'Connection Test Failed'}
          </p>
          <p className={`text-sm ${
            success 
              ? 'text-green-700 dark:text-green-300' 
              : 'text-red-700 dark:text-red-300'
          }`}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestResult;