import React from 'react';
import { Clock, User, Database, ExternalLink } from 'lucide-react';

interface ApplicationActivityProps {
  applicationId: string;
}

interface ActivityItem {
  id: string;
  type: 'created' | 'updated' | 'connection_added' | 'connection_removed' | 'external_connected';
  description: string;
  user: string;
  timestamp: string;
  icon: React.ReactNode;
}

const ApplicationActivity: React.FC<ApplicationActivityProps> = ({ applicationId }) => {
  // Mock activity data - replace with actual API call
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'external_connected',
      description: 'Connected to GitHub repository',
      user: 'John Doe',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      icon: <ExternalLink className="h-5 w-5 text-blue-500" />
    },
    {
      id: '2',
      type: 'connection_added',
      description: 'Added database connection "Production DB"',
      user: 'Jane Smith',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      icon: <Database className="h-5 w-5 text-green-500" />
    },
    {
      id: '3',
      type: 'updated',
      description: 'Updated application version to 2.0.0',
      user: 'John Doe',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      icon: <Clock className="h-5 w-5 text-yellow-500" />
    },
    {
      id: '4',
      type: 'created',
      description: 'Application created',
      user: 'Admin User',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      icon: <Clock className="h-5 w-5 text-gray-500" />
    }
  ];

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Less than an hour ago';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900">Activity Log</h2>
        <p className="mt-1 text-sm text-gray-500">
          Recent activity and changes to this application
        </p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {activities.map((activity, index) => (
            <li key={activity.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {activity.icon}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.description}
                    </p>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <User className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      <span className="mr-3">{activity.user}</span>
                      <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      <span>{formatTimestamp(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ApplicationActivity;