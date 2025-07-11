import React from 'react';
import { 
  Database, 
  Shield, 
  Zap, 
  Cloud, 
  BarChart3, 
  Users 
} from 'lucide-react';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: Database,
      title: 'Multi-Database Support',
      description: 'Connect to SQL Server, MySQL, PostgreSQL, Oracle, MongoDB, and more. Manage all your databases from one central location.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Role-based access control, audit logging, and comprehensive security features to protect your data and operations.',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: Zap,
      title: 'Real-time Monitoring',
      description: 'Monitor database performance, connection health, and system metrics with real-time dashboards and alerts.',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Cloud,
      title: 'Cloud Integration',
      description: 'Seamlessly integrate with AWS, Azure, Google Cloud, and other cloud platforms for hybrid deployments.',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Get insights into usage patterns, performance metrics, and operational trends with built-in analytics.',
      gradient: 'from-indigo-500 to-blue-500'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Multi-user support with granular permissions, team workspaces, and collaborative management tools.',
      gradient: 'from-pink-500 to-rose-500'
    }
  ];

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-6">
            Powerful Features for Modern Teams
          </h2>
          <p className="text-xl text-secondary-600 dark:text-secondary-300 max-w-3xl mx-auto">
            Everything you need to manage your applications, databases, and integrations 
            in one comprehensive platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-white dark:bg-secondary-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-secondary-100 dark:border-secondary-700"
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-4">
                {feature.title}
              </h3>
              
              <p className="text-secondary-600 dark:text-secondary-300 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;