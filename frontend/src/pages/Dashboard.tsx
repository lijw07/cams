import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Database, Activity, TrendingUp, Users, Server } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    {
      name: 'Total Applications',
      value: '12',
      icon: Package,
      color: 'bg-blue-500',
      change: '+2 from last week'
    },
    {
      name: 'Database Connections',
      value: '8',
      icon: Database,
      color: 'bg-green-500',
      change: '+1 from last week'
    },
    {
      name: 'Active Connections',
      value: '6',
      icon: Activity,
      color: 'bg-yellow-500',
      change: '75% uptime'
    },
    {
      name: 'System Health',
      value: '98%',
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: '+5% from last month'
    }
  ];

  const recentApplications = [
    { id: 1, name: 'E-commerce API', lastAccessed: '2 hours ago', status: 'active' },
    { id: 2, name: 'User Management', lastAccessed: '1 day ago', status: 'active' },
    { id: 3, name: 'Analytics Dashboard', lastAccessed: '3 days ago', status: 'inactive' }
  ];

  const recentConnections = [
    { id: 1, name: 'Production DB', type: 'PostgreSQL', status: 'connected' },
    { id: 2, name: 'Staging DB', type: 'MySQL', status: 'connected' },
    { id: 3, name: 'Analytics DB', type: 'MongoDB', status: 'disconnected' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.firstName || user?.username}!
            </h1>
            <p className="text-gray-600">
              Here's an overview of your applications and database connections.
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              to="/applications"
              className="btn btn-primary"
            >
              <Package className="w-4 h-4 mr-2" />
              New Application
            </Link>
            <Link
              to="/connections"
              className="btn btn-secondary"
            >
              <Database className="w-4 h-4 mr-2" />
              New Connection
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.change}</p>
              </div>
              <div className={`${stat.color} rounded-full p-3`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
              <Link
                to="/applications"
                className="text-sm text-primary hover:text-primary-dark"
              >
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {recentApplications.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{app.name}</p>
                      <p className="text-sm text-gray-500">Last accessed {app.lastAccessed}</p>
                    </div>
                  </div>
                  <span className={`badge ${app.status === 'active' ? 'badge-success' : 'badge-secondary'}`}>
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Connections */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Database Connections</h2>
              <Link
                to="/connections"
                className="text-sm text-primary hover:text-primary-dark"
              >
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {recentConnections.map((conn) => (
                <div key={conn.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Database className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{conn.name}</p>
                      <p className="text-sm text-gray-500">{conn.type}</p>
                    </div>
                  </div>
                  <span className={`badge ${conn.status === 'connected' ? 'badge-success' : 'badge-error'}`}>
                    {conn.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Server className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Database Server</p>
              <p className="text-sm text-green-600">Online</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">API Services</p>
              <p className="text-sm text-blue-600">Healthy</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Active Users</p>
              <p className="text-sm text-yellow-600">3 online</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;