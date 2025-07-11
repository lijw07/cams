import React, { useState } from 'react';

import { Link } from 'react-router-dom';

import Footer from '../components/layout/Footer';
import NavigationHeader from '../components/home/NavigationHeader';
import SEOHead from '../components/SEO/SEOHead';

const Documentation: React.FC = () => {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'About Us', href: '/about', isRoute: true },
    { name: 'Features', href: '/features', isRoute: true },
    { name: 'Integrations', href: '/integrations', isRoute: true },
    { name: 'Documentation', href: '/documentation', isRoute: true },
    { name: 'Pricing', href: '/pricing', isRoute: true },
  ];

  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      items: [
        { id: 'installation', title: 'Installation' },
        { id: 'quick-start', title: 'Quick Start Guide' },
        { id: 'authentication', title: 'Authentication' },
      ]
    },
    {
      id: 'database-connections',
      title: 'Database Connections',
      items: [
        { id: 'sql-server', title: 'SQL Server' },
        { id: 'mysql', title: 'MySQL' },
        { id: 'postgresql', title: 'PostgreSQL' },
        { id: 'oracle', title: 'Oracle' },
        { id: 'mongodb', title: 'MongoDB' },
      ]
    },
    {
      id: 'features',
      title: 'Features',
      items: [
        { id: 'monitoring', title: 'Real-time Monitoring' },
        { id: 'security', title: 'Security & Permissions' },
        { id: 'migration', title: 'Data Migration' },
        { id: 'backup', title: 'Backup & Recovery' },
      ]
    },
    {
      id: 'api',
      title: 'API Reference',
      items: [
        { id: 'rest-api', title: 'REST API' },
        { id: 'authentication-api', title: 'Authentication' },
        { id: 'webhooks', title: 'Webhooks' },
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      items: [
        { id: 'common-issues', title: 'Common Issues' },
        { id: 'error-codes', title: 'Error Codes' },
        { id: 'support', title: 'Getting Support' },
      ]
    }
  ];

  const getContent = (sectionId: string) => {
    switch (sectionId) {
      case 'getting-started':
        return (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Getting Started</h2>
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                Welcome to CAMS! This guide will help you get up and running with the Centralized Application Management System.
              </p>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Prerequisites</h3>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-6">
                <li>.NET 8.0 or higher</li>
                <li>SQL Server 2019 or higher (or compatible database)</li>
                <li>Modern web browser (Chrome, Firefox, Safari, Edge)</li>
                <li>Active internet connection for cloud features</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">System Requirements</h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
                <p className="text-gray-600 dark:text-gray-300 mb-2"><strong>Minimum:</strong></p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300">
                  <li>4GB RAM</li>
                  <li>2GB available disk space</li>
                  <li>1 GHz processor</li>
                </ul>
                <p className="text-gray-600 dark:text-gray-300 mt-4 mb-2"><strong>Recommended:</strong></p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300">
                  <li>8GB RAM or more</li>
                  <li>10GB available disk space</li>
                  <li>Multi-core processor</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">First Steps</h3>
              <ol className="list-decimal list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li>Create your CAMS account</li>
                <li>Set up your first database connection</li>
                <li>Configure user permissions and roles</li>
                <li>Explore the monitoring dashboard</li>
                <li>Review security settings</li>
              </ol>
            </div>
          </div>
        );

      case 'installation':
        return (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Installation</h2>
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Docker Installation (Recommended)</h3>
              <div className="bg-gray-900 text-green-400 rounded-lg p-4 mb-6 overflow-x-auto">
                <pre><code>{`# Clone the repository
git clone https://github.com/your-org/cams.git
cd cams

# Start with Docker Compose
docker-compose up -d

# Access CAMS at http://localhost:3000`}</code></pre>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Manual Installation</h3>
              <div className="bg-gray-900 text-green-400 rounded-lg p-4 mb-6 overflow-x-auto">
                <pre><code>{`# Backend setup
cd backend
dotnet restore
dotnet build
dotnet run

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev`}</code></pre>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4 mb-6">
                <p className="text-blue-700 dark:text-blue-300">
                  <strong>Note:</strong> Make sure to configure your database connection string in appsettings.json before starting the backend.
                </p>
              </div>
            </div>
          </div>
        );

      case 'sql-server':
        return (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">SQL Server Connection</h2>
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                Connect CAMS to your SQL Server instances for centralized management and monitoring.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Connection String Format</h3>
              <div className="bg-gray-900 text-green-400 rounded-lg p-4 mb-6 overflow-x-auto">
                <pre><code>{`Server=your-server;Database=your-database;Trusted_Connection=true;`}</code></pre>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Authentication Methods</h3>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-6">
                <li><strong>Windows Authentication:</strong> Uses current Windows credentials</li>
                <li><strong>SQL Server Authentication:</strong> Uses username and password</li>
                <li><strong>Azure AD Authentication:</strong> For Azure SQL Database</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Required Permissions</h3>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4">
                <p className="text-yellow-700 dark:text-yellow-300">
                  Ensure your SQL Server user has the following minimum permissions:
                </p>
                <ul className="list-disc list-inside text-yellow-700 dark:text-yellow-300 mt-2">
                  <li>db_datareader</li>
                  <li>db_datawriter</li>
                  <li>VIEW SERVER STATE (for monitoring)</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'monitoring':
        return (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Real-time Monitoring</h2>
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                CAMS provides comprehensive monitoring capabilities for all your database connections.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Key Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Performance</h4>
                  <ul className="text-gray-600 dark:text-gray-300 text-sm">
                    <li>• Query execution times</li>
                    <li>• Connection pool usage</li>
                    <li>• CPU and memory usage</li>
                    <li>• I/O operations</li>
                  </ul>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Health</h4>
                  <ul className="text-gray-600 dark:text-gray-300 text-sm">
                    <li>• Connection status</li>
                    <li>• Error rates</li>
                    <li>• Uptime statistics</li>
                    <li>• Alert notifications</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Setting Up Alerts</h3>
              <ol className="list-decimal list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li>Navigate to Settings → Monitoring</li>
                <li>Configure alert thresholds</li>
                <li>Set up notification channels (email, Slack, etc.)</li>
                <li>Test alert configuration</li>
              </ol>
            </div>
          </div>
        );

      case 'rest-api':
        return (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">REST API Reference</h2>
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                The CAMS REST API provides programmatic access to all platform features.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Base URL</h3>
              <div className="bg-gray-900 text-green-400 rounded-lg p-4 mb-6">
                <code>https://api.cams.your-domain.com/v1</code>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Authentication</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                All API requests require authentication using Bearer tokens:
              </p>
              <div className="bg-gray-900 text-green-400 rounded-lg p-4 mb-6 overflow-x-auto">
                <pre><code>{`curl -H "Authorization: Bearer YOUR_API_TOKEN" \\
     https://api.cams.your-domain.com/v1/applications`}</code></pre>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Common Endpoints</h3>
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">GET /applications</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Retrieve all applications</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">POST /database-connections</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Create a new database connection</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">GET /logs/audit</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Retrieve audit logs</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Documentation</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Select a topic from the sidebar to view detailed documentation.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-secondary-900">
      <SEOHead
        title="Documentation - CAMS"
        description="Complete documentation for CAMS including setup guides, API reference, and troubleshooting information."
        keywords="CAMS documentation, database management guide, API reference, setup guide"
        type="website"
      />
      
      <NavigationHeader
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        navItems={navItems}
        showNavItems={true}
      />

      <div className="flex pt-16">
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 dark:bg-secondary-800 min-h-screen border-r border-gray-200 dark:border-gray-700">
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Documentation</h3>
            <nav className="space-y-2">
              {sections.map((section) => (
                <div key={section.id}>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide mb-2">
                    {section.title}
                  </h4>
                  <ul className="space-y-1 mb-4">
                    {section.items.map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={() => setActiveSection(item.id)}
                          className={`block w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                            activeSection === item.id
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {item.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {getContent(activeSection)}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Documentation;