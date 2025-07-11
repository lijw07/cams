import React, { useState } from 'react';

import { Link } from 'react-router-dom';

import { 
  Database, 
  Shield, 
  Zap, 
  Cloud, 
  BarChart3, 
  Users,
  Monitor,
  Lock,
  Globe,
  AlertTriangle,
  Layers,
  Settings
} from 'lucide-react';

import Footer from '../components/layout/Footer';
import NavigationHeader from '../components/home/NavigationHeader';
import SEOHead from '../components/SEO/SEOHead';

const Features: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'About Us', href: '/about', isRoute: true },
    { name: 'Features', href: '/features', isRoute: true },
    { name: 'Integrations', href: '/integrations', isRoute: true },
    { name: 'Documentation', href: '/documentation', isRoute: true },
    { name: 'Pricing', href: '/pricing', isRoute: true },
  ];
  const coreFeatures = [
    {
      icon: Database,
      title: 'Multi-Database Support',
      description: 'Connect to SQL Server, MySQL, PostgreSQL, Oracle, MongoDB, and more. Manage all your databases from one central location.',
      gradient: 'from-blue-500 to-cyan-500',
      details: [
        'Support for 15+ database types',
        'Unified connection management',
        'Real-time connection monitoring',
        'Connection pooling optimization'
      ]
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Role-based access control, audit logging, and compliance features to keep your data secure and meet regulatory requirements.',
      gradient: 'from-green-500 to-emerald-500',
      details: [
        'Role-based access control (RBAC)',
        'SOC 2 Type II compliance',
        'End-to-end encryption',
        'Comprehensive audit trails'
      ]
    },
    {
      icon: Zap,
      title: 'Real-time Monitoring',
      description: 'Monitor database performance, query execution times, and connection health with real-time dashboards and alerts.',
      gradient: 'from-yellow-500 to-orange-500',
      details: [
        'Performance metrics dashboard',
        'Query execution analytics',
        'Custom alert configurations',
        'Historical trend analysis'
      ]
    },
    {
      icon: Cloud,
      title: 'Cloud Integration',
      description: 'Seamlessly connect to cloud databases on AWS, Azure, and Google Cloud with native integrations and optimizations.',
      gradient: 'from-purple-500 to-pink-500',
      details: [
        'AWS RDS & Aurora support',
        'Azure SQL Database integration',
        'Google Cloud SQL connectivity',
        'Multi-cloud deployment options'
      ]
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Get insights into your database usage patterns, performance trends, and optimization opportunities.',
      gradient: 'from-indigo-500 to-blue-500',
      details: [
        'Usage pattern analysis',
        'Performance bottleneck detection',
        'Cost optimization recommendations',
        'Custom reporting dashboards'
      ]
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Share database connections, manage team permissions, and collaborate effectively with built-in team features.',
      gradient: 'from-red-500 to-rose-500',
      details: [
        'Team workspace management',
        'Permission inheritance',
        'Collaborative query editing',
        'Activity tracking and notifications'
      ]
    }
  ];

  const additionalFeatures = [
    {
      icon: Monitor,
      title: 'Unified Dashboard',
      description: 'Single pane of glass for all your database operations'
    },
    {
      icon: Lock,
      title: 'Data Encryption',
      description: 'End-to-end encryption for data in transit and at rest'
    },
    {
      icon: Globe,
      title: 'Global Deployment',
      description: 'Deploy across multiple regions with low latency'
    },
    {
      icon: AlertTriangle,
      title: 'Smart Alerts',
      description: 'Intelligent alerting based on ML-powered anomaly detection'
    },
    {
      icon: Layers,
      title: 'API Integration',
      description: 'RESTful APIs for seamless integration with existing tools'
    },
    {
      icon: Settings,
      title: 'Custom Workflows',
      description: 'Automate database operations with custom workflows'
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-secondary-900">
      <SEOHead
        title="Features - CAMS Database Management Platform"
        description="Explore CAMS comprehensive features including multi-database support, enterprise security, real-time monitoring, cloud integration, and team collaboration tools."
        keywords="CAMS features, database management features, multi-database support, enterprise security, real-time monitoring, cloud integration"
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
              Powerful Features for Modern Teams
            </h1>
            <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto">
              Everything you need to manage, monitor, and secure your database operations at scale
            </p>
          </div>
        </div>
      </div>

      {/* Core Features Section */}
      <div className="py-20 bg-gray-50 dark:bg-secondary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Core Features
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Comprehensive database management capabilities designed for enterprise environments
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-secondary-900 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {feature.description}
                </p>

                <ul className="space-y-2">
                  {feature.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Features Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Additional Capabilities
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Extended features that make CAMS the complete solution for your database management needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {additionalFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex items-start p-6 bg-gray-50 dark:bg-secondary-800 rounded-xl hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors duration-200"
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Comparison Section */}
      <div className="py-20 bg-gray-50 dark:bg-secondary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose CAMS?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              See how CAMS compares to traditional database management approaches
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Traditional Approach</h3>
              <div className="space-y-4">
                {[
                  'Multiple tools for different databases',
                  'Manual connection management',
                  'Limited security features',
                  'No centralized monitoring',
                  'Difficult team collaboration',
                  'Time-consuming setup processes'
                ].map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-6 h-6 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mr-3">
                      <span className="text-red-600 dark:text-red-400 text-sm">✗</span>
                    </div>
                    <span className="text-gray-600 dark:text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">CAMS Approach</h3>
              <div className="space-y-4">
                {[
                  'Unified platform for all databases',
                  'Automated connection management',
                  'Enterprise-grade security built-in',
                  'Real-time monitoring & analytics',
                  'Seamless team collaboration',
                  'Quick deployment & easy setup'
                ].map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3">
                      <span className="text-green-600 dark:text-green-400 text-sm">✓</span>
                    </div>
                    <span className="text-gray-600 dark:text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Experience These Features?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            See how CAMS can transform your database management workflow
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact-sales"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
            <Link
              to="/documentation"
              className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-secondary-800 transition-colors"
            >
              View Documentation
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Features;