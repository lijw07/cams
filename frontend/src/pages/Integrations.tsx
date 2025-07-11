import React, { useState } from 'react';

import { Link } from 'react-router-dom';

import { 
  Database, 
  Cloud, 
  Server,
  // Layers, // TODO: Use for integration layers visualization
  Code,
  Globe,
  // Shield, // TODO: Use for security features
  Zap,
  Activity,
  Settings,
  Bell,
  Users
} from 'lucide-react';

import NavigationHeader from '../components/home/NavigationHeader';
import Footer from '../components/layout/Footer';
import SEOHead from '../components/SEO/SEOHead';

const Integrations: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'About Us', href: '/about', isRoute: true },
    { name: 'Features', href: '/features', isRoute: true },
    { name: 'Integrations', href: '/integrations', isRoute: true },
    { name: 'Documentation', href: '/documentation', isRoute: true },
    { name: 'Pricing', href: '/pricing', isRoute: true },
  ];
  const databaseIntegrations = [
    {
      name: 'SQL Server',
      description: 'Microsoft SQL Server with advanced features',
      icon: Database,
      features: ['Windows & SQL Authentication', 'Always On support', 'Performance insights'],
      color: 'blue'
    },
    {
      name: 'MySQL',
      description: 'Open-source relational database',
      icon: Database,
      features: ['MySQL 5.7+ support', 'Read replicas', 'Performance Schema'],
      color: 'orange'
    },
    {
      name: 'PostgreSQL',
      description: 'Advanced open-source database',
      icon: Database,
      features: ['JSON support', 'Extensions', 'Advanced indexing'],
      color: 'blue'
    },
    {
      name: 'Oracle',
      description: 'Enterprise database platform',
      icon: Database,
      features: ['RAC support', 'Pluggable databases', 'Advanced security'],
      color: 'red'
    },
    {
      name: 'MongoDB',
      description: 'NoSQL document database',
      icon: Database,
      features: ['Replica sets', 'Sharding', 'Atlas integration'],
      color: 'green'
    },
    {
      name: 'Redis',
      description: 'In-memory data structure store',
      icon: Database,
      features: ['Cluster mode', 'Persistence', 'Pub/Sub'],
      color: 'red'
    }
  ];

  const cloudIntegrations = [
    {
      name: 'AWS RDS',
      description: 'Amazon Relational Database Service',
      icon: Cloud,
      features: ['Multi-AZ deployments', 'Read replicas', 'Automated backups'],
      color: 'orange',
      logo: '🟠'
    },
    {
      name: 'Azure SQL',
      description: 'Microsoft Azure SQL Database',
      icon: Cloud,
      features: ['Elastic pools', 'Managed instances', 'Serverless compute'],
      color: 'blue',
      logo: '🔵'
    },
    {
      name: 'Google Cloud SQL',
      description: 'Google Cloud managed database',
      icon: Cloud,
      features: ['High availability', 'Point-in-time recovery', 'Read replicas'],
      color: 'blue',
      logo: '🔴'
    },
    {
      name: 'AWS Aurora',
      description: 'MySQL and PostgreSQL compatible',
      icon: Cloud,
      features: ['Auto-scaling', 'Global clusters', 'Serverless'],
      color: 'purple',
      logo: '🟠'
    }
  ];

  const toolIntegrations = [
    {
      name: 'Slack',
      description: 'Team communication and alerts',
      icon: Bell,
      category: 'Communication',
      color: 'purple'
    },
    {
      name: 'Microsoft Teams',
      description: 'Enterprise collaboration platform',
      icon: Users,
      category: 'Communication',
      color: 'blue'
    },
    {
      name: 'Datadog',
      description: 'Monitoring and analytics platform',
      icon: Activity,
      category: 'Monitoring',
      color: 'purple'
    },
    {
      name: 'New Relic',
      description: 'Application performance monitoring',
      icon: Activity,
      category: 'Monitoring',
      color: 'green'
    },
    {
      name: 'Grafana',
      description: 'Open-source analytics & monitoring',
      icon: Activity,
      category: 'Monitoring',
      color: 'orange'
    },
    {
      name: 'Jenkins',
      description: 'Continuous integration and deployment',
      icon: Settings,
      category: 'CI/CD',
      color: 'blue'
    },
    {
      name: 'GitHub Actions',
      description: 'Workflow automation platform',
      icon: Code,
      category: 'CI/CD',
      color: 'gray'
    },
    {
      name: 'Terraform',
      description: 'Infrastructure as Code',
      icon: Server,
      category: 'Infrastructure',
      color: 'purple'
    }
  ];

  const apiCapabilities = [
    {
      title: 'RESTful APIs',
      description: 'Complete REST API coverage for all CAMS functionality',
      icon: Globe,
      features: [
        'OpenAPI 3.0 specification',
        'Authentication via API keys',
        'Rate limiting and throttling',
        'Comprehensive error handling'
      ]
    },
    {
      title: 'Webhooks',
      description: 'Real-time event notifications for your applications',
      icon: Zap,
      features: [
        'Connection status changes',
        'Performance threshold alerts',
        'Security event notifications',
        'Custom payload formats'
      ]
    },
    {
      title: 'SDKs',
      description: 'Official SDKs for popular programming languages',
      icon: Code,
      features: [
        'Python SDK with async support',
        'Node.js TypeScript SDK',
        'Go SDK for high performance',
        'C# SDK for .NET applications'
      ]
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
      orange: 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400',
      red: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400',
      green: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
      purple: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
      gray: 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400'
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-secondary-900">
      <SEOHead
        title="Integrations - CAMS Database Management Platform"
        description="Explore CAMS extensive integrations including databases, cloud platforms, monitoring tools, and APIs. Connect with your existing tech stack seamlessly."
        keywords="CAMS integrations, database integrations, cloud platforms, monitoring tools, APIs, webhooks, SDKs"
        type="website"
      />
      
      <NavigationHeader
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        navItems={navItems}
        showNavItems={true}
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Seamless Integrations
            </h1>
            <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto">
              Connect CAMS with your existing tools and infrastructure for a unified experience
            </p>
          </div>
        </div>
      </div>

      {/* Database Integrations */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Database Integrations
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Native support for all major database platforms with optimized drivers and advanced features
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {databaseIntegrations.map((integration, index) => (
              <div
                key={index}
                className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-12 h-12 ${getColorClasses(integration.color)} rounded-lg flex items-center justify-center mb-4`}>
                  <integration.icon className="w-6 h-6" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {integration.name}
                </h3>
                
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {integration.description}
                </p>

                <ul className="space-y-1">
                  {integration.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cloud Integrations */}
      <div className="py-20 bg-gray-50 dark:bg-secondary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Cloud Platform Integrations
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Connect to managed database services across all major cloud providers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cloudIntegrations.map((integration, index) => (
              <div
                key={index}
                className="bg-white dark:bg-secondary-900 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 flex items-start"
              >
                <div className="text-3xl mr-4 mt-1">
                  {integration.logo}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {integration.name}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {integration.description}
                  </p>

                  <ul className="space-y-1">
                    {integration.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tool Integrations */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Third-Party Tool Integrations
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Integrate with your existing workflow tools for notifications, monitoring, and automation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {toolIntegrations.map((integration, index) => (
              <div
                key={index}
                className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 text-center"
              >
                <div className={`w-12 h-12 ${getColorClasses(integration.color)} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                  <integration.icon className="w-6 h-6" />
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {integration.name}
                </h3>
                
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {integration.description}
                </p>

                <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-full">
                  {integration.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* API & Developer Tools */}
      <div className="py-20 bg-gray-50 dark:bg-secondary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              APIs & Developer Tools
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Build custom integrations and automate workflows with our comprehensive API platform
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {apiCapabilities.map((capability, index) => (
              <div
                key={index}
                className="bg-white dark:bg-secondary-900 rounded-xl p-8 shadow-lg"
              >
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-2xl flex items-center justify-center mb-6">
                  <capability.icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {capability.title}
                </h3>
                
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {capability.description}
                </p>

                <ul className="space-y-2">
                  {capability.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Integration CTA */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Need a Custom Integration?
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              Our team can help you build custom integrations tailored to your specific requirements
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact-sales"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Contact Our Team
              </Link>
              <Link
                to="/documentation"
                className="border border-white/20 text-white px-8 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors"
              >
                View API Docs
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Integrations;