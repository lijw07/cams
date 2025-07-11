import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search, Database } from 'lucide-react';
import SEOHead from '../components/SEO/SEOHead';

const NotFound: React.FC = () => {
  const popularPages = [
    { name: 'Database Management', path: '/applications', icon: Database },
    { name: 'User Login', path: '/login', icon: Home },
    { name: 'Contact Sales', path: '/contact-sales', icon: Search },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center px-4">
      <SEOHead
        title="404 - Page Not Found | CAMS"
        description="The page you're looking for could not be found. Explore CAMS database management features or return to our homepage."
        keywords="404, page not found, CAMS, database management"
        noIndex={true}
      />
      
      <div className="max-w-2xl w-full text-center">
        {/* 404 Hero Section */}
        <div className="mb-12">
          <div className="mb-6">
            <Database className="w-24 h-24 mx-auto text-primary-500 mb-4" />
          </div>
          <h1 className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600 mb-4">
            404
          </h1>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Page Not Found
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              <Home className="w-5 h-5 mr-2" />
              Back to Home
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Go Back
            </button>
          </div>
        </div>

        {/* Popular Pages */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Or visit one of these popular pages:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {popularPages.map((page, index) => (
              <Link
                key={index}
                to={page.path}
                className="group p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700"
              >
                <page.icon className="w-8 h-8 mx-auto mb-2 text-primary-500 group-hover:text-primary-600 transition-colors duration-200" />
                <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                  {page.name}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            If you believe this is a mistake, please{' '}
            <Link to="/contact-sales" className="text-primary-600 hover:text-primary-700 underline">
              contact our support team
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
};

export default NotFound;