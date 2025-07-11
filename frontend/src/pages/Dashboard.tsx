import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Package, Users, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/dashboardService';
import { useNotifications } from '../contexts/NotificationContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalApplications: 0,
    totalRoles: 0,
    isLoading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardService.getDashboardStats();
        setStats({
          totalUsers: data.totalUsers,
          totalApplications: data.totalApplications,
          totalRoles: data.totalRoles,
          isLoading: false
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        addNotification({
          title: 'Error',
          message: 'Failed to load dashboard statistics',
          type: 'error',
          source: 'Dashboard'
        });
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchStats();
  }, [addNotification]);

  // Memoize statCards to prevent recreation on every render
  const statCards = useMemo(() => [
    {
      name: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-purple-500',
      link: '/management/users'
    },
    {
      name: 'Total Applications',
      value: stats.totalApplications,
      icon: Package,
      color: 'bg-blue-500',
      link: '/applications'
    },
    {
      name: 'Total Roles',
      value: stats.totalRoles,
      icon: Shield,
      color: 'bg-green-500',
      link: '/management/roles'
    }
  ], [stats.totalUsers, stats.totalApplications, stats.totalRoles]);


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user?.FirstName || user?.Username}!
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Here's an overview of your applications and database connections.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <Link key={stat.name} to={stat.link} className="block">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.name}</p>
                  {stats.isLoading ? (
                    <div className="h-9 w-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                  ) : (
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  )}
                </div>
                <div className={`${stat.color} rounded-full p-3`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>


    </div>
  );
};

export default Dashboard;