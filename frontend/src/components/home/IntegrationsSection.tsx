import React from 'react';
import { ArrowRight, FileText } from 'lucide-react';

const IntegrationsSection: React.FC = () => {
  const databaseTools = [
    { name: 'SQL Server', logo: '🔷', color: 'from-blue-500 to-blue-600' },
    { name: 'MySQL', logo: '🐬', color: 'from-orange-500 to-orange-600' },
    { name: 'PostgreSQL', logo: '🐘', color: 'from-blue-600 to-indigo-600' },
    { name: 'Oracle', logo: '🔴', color: 'from-red-500 to-red-600' },
    { name: 'MongoDB', logo: '🍃', color: 'from-green-500 to-green-600' },
    { name: 'Redis', logo: '⚡', color: 'from-red-400 to-red-500' },
    { name: 'AWS RDS', logo: '☁️', color: 'from-yellow-500 to-orange-500' },
    { name: 'Azure SQL', logo: '🔷', color: 'from-blue-400 to-blue-500' },
    { name: 'Google Cloud', logo: '🌐', color: 'from-blue-500 to-green-500' },
    { name: 'SQLite', logo: '📦', color: 'from-gray-500 to-gray-600' },
    { name: 'Cassandra', logo: '🗄️', color: 'from-purple-500 to-purple-600' },
    { name: 'REST APIs', logo: '🔗', color: 'from-indigo-500 to-purple-500' },
  ];

  const externalTools = [
    { 
      name: 'GitHub', 
      logo: '🐙', 
      color: 'from-gray-700 to-gray-900',
      description: 'Repository management, commits, issues, PRs'
    },
    { 
      name: 'ADP', 
      logo: '👥', 
      color: 'from-blue-600 to-blue-800',
      description: 'HR data, payroll, employee management'
    },
    { 
      name: 'Slack', 
      logo: '💬', 
      color: 'from-purple-500 to-purple-700',
      description: 'Team communication, channels, notifications'
    },
    { 
      name: 'Jira', 
      logo: '🎯', 
      color: 'from-blue-500 to-blue-700',
      description: 'Project tracking, tickets, workflows'
    },
    { 
      name: 'Salesforce', 
      logo: '☁️', 
      color: 'from-blue-400 to-cyan-600',
      description: 'CRM data, leads, opportunities, accounts'
    },
    { 
      name: 'Office 365', 
      logo: '📊', 
      color: 'from-orange-500 to-red-600',
      description: 'SharePoint, Teams, Exchange, OneDrive'
    },
    { 
      name: 'ServiceNow', 
      logo: '🔧', 
      color: 'from-green-600 to-green-800',
      description: 'IT service management, incidents, changes'
    },
    { 
      name: 'Stripe', 
      logo: '💳', 
      color: 'from-indigo-500 to-purple-600',
      description: 'Payment processing, subscriptions, billing'
    },
    { 
      name: 'AWS Services', 
      logo: '☁️', 
      color: 'from-yellow-500 to-orange-600',
      description: 'S3, Lambda, CloudWatch, EC2'
    },
    { 
      name: 'Custom APIs', 
      logo: '🔗', 
      color: 'from-purple-500 to-indigo-600',
      description: 'RESTful APIs, GraphQL, webhooks'
    },
  ];

  return (
    <section id="tools" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary-50 dark:bg-secondary-800">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-6">
            Supported Integrations
          </h2>
          <p className="text-xl text-secondary-600 dark:text-secondary-300 max-w-3xl mx-auto">
            Connect to databases, external APIs, and third-party services with our comprehensive integration platform.
          </p>
        </div>

        {/* Database Tools */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-secondary-900 dark:text-white mb-8 text-center">
            Database Systems
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {databaseTools.map((tool, index) => (
              <div
                key={index}
                className="group bg-white dark:bg-secondary-700 rounded-2xl p-4 text-center shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className={`w-12 h-12 mx-auto mb-3 bg-gradient-to-br ${tool.color} rounded-xl flex items-center justify-center text-lg shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110`}>
                  {tool.logo}
                </div>
                <h4 className="font-semibold text-sm text-secondary-900 dark:text-white">{tool.name}</h4>
              </div>
            ))}
          </div>
        </div>

        {/* External Tools & APIs */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-secondary-900 dark:text-white mb-8 text-center">
            External Tools & APIs
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {externalTools.map((tool, index) => (
              <div
                key={index}
                className="group bg-white dark:bg-secondary-700 rounded-2xl p-6 text-center shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${tool.color} rounded-xl flex items-center justify-center text-2xl shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110`}>
                  {tool.logo}
                </div>
                <h4 className="font-semibold text-secondary-900 dark:text-white mb-2">{tool.name}</h4>
                <p className="text-xs text-secondary-600 dark:text-secondary-400 leading-relaxed">{tool.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <p className="text-secondary-600 dark:text-secondary-400 mb-6">
            Don't see your tool or API? We're constantly adding new integrations and can build custom connectors.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-600 text-white font-medium rounded-lg hover:from-primary-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105">
              Request Integration
              <ArrowRight className="ml-2 w-4 h-4" />
            </button>
            <button className="inline-flex items-center px-6 py-3 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white border border-secondary-300 dark:border-secondary-600 font-medium rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-600 transition-all duration-200">
              View API Documentation
              <FileText className="ml-2 w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntegrationsSection;