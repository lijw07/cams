import React from 'react';

import ConnectionTestScheduling from '../components/settings/ConnectionTestScheduling';

const ConnectionTestDemo: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">Connection Test Scheduling Demo</h1>
        <p className="text-secondary-600 dark:text-secondary-400">
          This demonstrates the new cron-based connection test scheduling feature
        </p>
      </div>

      <ConnectionTestScheduling />

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-400 mb-3">Feature Overview</h3>
        <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
          <li>• Schedule automatic connection tests for applications</li>
          <li>• Use cron expressions for flexible scheduling</li>
          <li>• Choose from preset schedules or create custom ones</li>
          <li>• Real-time validation of cron expressions</li>
          <li>• Enable/disable schedules with a toggle</li>
          <li>• View last run status and next scheduled run</li>
        </ul>
      </div>
    </div>
  );
};

export default ConnectionTestDemo;