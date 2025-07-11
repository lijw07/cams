import React from 'react';

import { useNavigate, Link } from 'react-router-dom';

import { Menu, X } from 'lucide-react';

interface NavigationHeaderProps {
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
  navItems?: Array<{ name: string; href: string; isRoute: boolean }>;
  showNavItems?: boolean;
}

const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  mobileMenuOpen = false,
  setMobileMenuOpen = () => {},
  navItems = [],
  showNavItems = true
}) => {
  const navigate = useNavigate();

  const handleNavigation = (item: { name: string; href: string; isRoute: boolean }) => {
    if (item.isRoute) {
      navigate(item.href);
    } else {
      const element = document.querySelector(item.href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-secondary-900/80 backdrop-blur-lg border-b border-secondary-200/50 dark:border-secondary-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-primary-600 hover:text-primary-700 transition-colors">
              CAMS
            </Link>
          </div>

          {/* Desktop Navigation */}
          {showNavItems && (
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                {navItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item)}
                    className="text-secondary-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 text-sm font-medium transition-colors duration-200 cursor-pointer"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => navigate('/login')}
              className="text-secondary-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 px-4 py-2 text-sm font-medium transition-colors duration-200"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/contact-sales')}
              className="bg-gradient-to-r from-primary-600 to-purple-600 text-white px-6 py-2 text-sm font-medium rounded-lg hover:from-primary-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
            >
              Get Started
            </button>
          </div>

          {/* Mobile menu button */}
          {showNavItems && (
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-secondary-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 p-2"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        {showNavItems && mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-secondary-900 rounded-lg mt-2 shadow-lg border border-secondary-200 dark:border-secondary-700">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item)}
                  className="block w-full text-left text-secondary-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 text-base font-medium transition-colors duration-200"
                >
                  {item.name}
                </button>
              ))}
              <div className="border-t border-secondary-200 dark:border-secondary-700 pt-2 mt-2">
                <button
                  onClick={() => {
                    navigate('/login');
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left text-secondary-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 text-base font-medium transition-colors duration-200"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    navigate('/contact-sales');
                    setMobileMenuOpen(false);
                  }}
                  className="mt-2 w-full bg-gradient-to-r from-primary-600 to-purple-600 text-white px-6 py-2 text-base font-medium rounded-lg hover:from-primary-700 hover:to-purple-700 transition-all duration-200"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavigationHeader;