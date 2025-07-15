import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Package, 
  Database, 
  ExternalLink, 
  Settings, 
  Activity,
  ArrowLeft,
  Edit,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { applicationService } from '../services/applicationService';
import { Application } from '../types/application';
import { useNotifications } from '../contexts/NotificationContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import DatabaseConnectionsList from '../components/applications/DatabaseConnectionsList';
import ApplicationExternalConnections from '../components/applications/ApplicationExternalConnections';
import ApplicationActivity from '../components/applications/ApplicationActivity';
import ApplicationSettings from '../components/applications/ApplicationSettings';

const ApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'database' | 'external' | 'activity' | 'settings'>('overview');

  useEffect(() => {
    if (id) {
      loadApplication();
    }
  }, [id]);

  const loadApplication = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await applicationService.getApplication(id);
      setApplication(data);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load application details'
      });
      navigate('/applications');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadApplication();
  };

  const handleEdit = () => {
    if (application) {
      navigate(`/applications/${application.Id}/edit`);
    }
  };

  const handleDelete = async () => {
    if (!application || !window.confirm('Are you sure you want to delete this application?')) {
      return;
    }

    try {
      await applicationService.deleteApplication(application.Id);
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Application deleted successfully'
      });
      navigate('/applications');
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete application'
      });
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!application) {
    return <div>Application not found</div>;
  }

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Package },
    { id: 'database' as const, label: 'Database Connections', icon: Database, count: application.DatabaseConnectionCount },
    { id: 'external' as const, label: 'External Connections', icon: ExternalLink },
    { id: 'activity' as const, label: 'Activity', icon: Activity },
    { id: 'settings' as const, label: 'Settings', icon: Settings }
  ];

  return (
    <div className="h-full bg-gray-50">
      <div className="bg-white shadow">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/applications')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </button>
              <div className="flex items-center space-x-3">
                <Package className="h-8 w-8 text-gray-900" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{application.Name}</h1>
                  <p className="text-sm text-gray-500">
                    {application.Environment && <span className="mr-2">Environment: {application.Environment}</span>}
                    {application.Version && <span>Version: {application.Version}</span>}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
              <button
                onClick={handleEdit}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>

          <div className="mt-4 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`mr-2 h-5 w-5 ${
                      activeTab === tab.id ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`} />
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                        activeTab === tab.id
                          ? 'bg-primary-100 text-primary-600'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Application Information</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {application.Description || 'No description provided'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Tags</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {application.Tags || 'No tags'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      application.IsActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {application.IsActive ? 'Active' : 'Inactive'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(application.CreatedAt).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(application.UpdatedAt).toLocaleString()}
                  </dd>
                </div>
                {application.LastAccessedAt && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Accessed</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(application.LastAccessedAt).toLocaleString()}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h2>
              <div className="bg-gray-50 p-4 rounded">
                <dt className="text-sm font-medium text-gray-500">Database Connections</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {application.DatabaseConnectionCount}
                </dd>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'database' && (
          <DatabaseConnectionsList applicationId={application.Id} />
        )}

        {activeTab === 'external' && (
          <ApplicationExternalConnections 
            applicationId={application.Id} 
            applicationName={application.Name}
          />
        )}

        {activeTab === 'activity' && (
          <ApplicationActivity applicationId={application.Id} />
        )}

        {activeTab === 'settings' && (
          <ApplicationSettings 
            application={application} 
            onUpdate={(updatedApp) => setApplication(updatedApp)}
          />
        )}
      </div>
    </div>
  );
};

export default ApplicationDetail;