import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Database } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ApplicationWithConnectionModal from '../components/modals/ApplicationWithConnectionModal';
import { applicationService } from '../services/applicationService';
import { ApplicationWithConnectionRequest } from '../types';
import { useNotifications } from '../contexts/NotificationContext';
import { useEventTracking } from '../hooks/useEventTracking';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addNotification } = useNotifications();
  const { trackApplication, trackConnection, trackError } = useEventTracking();

  const handleCreateApplicationWithConnection = async (data: ApplicationWithConnectionRequest) => {
    try {
      const response = await applicationService.createApplicationWithConnection(data);
      
      // Track application creation
      trackApplication(
        'create',
        response.application.id,
        response.application.name,
        data.databaseConnection.databaseType
      );
      
      // Track connection creation and test
      trackConnection('create', true, data.databaseConnection.databaseType);
      trackConnection('test', response.connectionTestResult, data.databaseConnection.databaseType);
      
      addNotification({
        title: 'Application Created',
        message: 'Application and connection created successfully',
        type: 'success',
        source: 'Dashboard'
      });
      
      if (response.connectionTestResult) {
        addNotification({
          title: 'Connection Test',
          message: 'Database connection test passed',
          type: 'success',
          source: 'Dashboard'
        });
      } else if (response.connectionTestMessage) {
        addNotification({
          title: 'Connection Test Failed',
          message: `Connection test failed: ${response.connectionTestMessage}`,
          type: 'error',
          source: 'Dashboard'
        });
      }
      
      navigate(`/applications/${response.application.id}`);
    } catch (error) {
      console.error('Error creating application with connection:', error);
      
      // Track application creation failure
      trackError(
        error instanceof Error ? error.message : 'Failed to create application',
        'APPLICATION_CREATE_ERROR',
        'Dashboard.tsx'
      );
      
      addNotification({
        title: 'Creation Failed',
        message: 'Failed to create application with connection',
        type: 'error',
        source: 'Dashboard'
      });
      throw error;
    }
  };

  const stats = [
    {
      name: 'Total Applications',
      value: user?.applicationCount || 0,
      icon: Package,
      color: 'bg-blue-500'
    },
    {
      name: 'Database Connections',
      value: user?.databaseConnectionCount || 0,
      icon: Database,
      color: 'bg-green-500'
    }
  ];


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user?.firstName || user?.username}!
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Here's an overview of your applications and database connections.
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary"
            >
              <Package className="w-4 h-4 mr-2" />
              New Application
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
              <div className={`${stat.color} rounded-full p-3`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4">
          <Link
            to="/applications"
            className="p-4 border border-gray-200 rounded-lg hover:border-primary-600 hover:shadow-md transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Manage Applications</p>
                <p className="text-sm text-gray-500">View and configure your applications with their database connections</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      <ApplicationWithConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateApplicationWithConnection}
      />
    </div>
  );
};

export default Dashboard;