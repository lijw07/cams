import React from 'react';

import { NavLink, useLocation } from 'react-router-dom';

import { 
  Home, 
  Package, 
  Database, 
  X,
  Users,
  Shield,
  FileText,
  Activity,
  AlertTriangle,
  BarChart3,
  Upload,
  Github
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const location = useLocation();
  const { user } = useAuth();
  
  // Check if user has admin privileges (for management sections)
  const isAdmin = user?.Roles?.some((role: string) => role === 'Admin' || role === 'PlatformAdmin') ?? false;
  
  // Check if user has platform admin privileges (for logs)
  const isPlatformAdmin = user?.Roles?.some((role: string) => role === 'PlatformAdmin') ?? false;

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      current: location.pathname === '/dashboard'
    },
    {
      name: 'Applications',
      href: '/applications',
      icon: Package,
      current: location.pathname.startsWith('/applications')
    }
  ];

  const logItems = [
    {
      name: 'Audit Logs',
      href: '/logs/audit',
      icon: FileText,
      current: location.pathname.startsWith('/logs/audit')
    },
    {
      name: 'System Logs',
      href: '/logs/system',
      icon: Activity,
      current: location.pathname.startsWith('/logs/system')
    },
    {
      name: 'Security Logs',
      href: '/logs/security',
      icon: AlertTriangle,
      current: location.pathname.startsWith('/logs/security')
    },
    {
      name: 'Performance Logs',
      href: '/logs/performance',
      icon: BarChart3,
      current: location.pathname.startsWith('/logs/performance')
    }
  ];

  const managementItems = [
    {
      name: 'User Management',
      href: '/management/users',
      icon: Users,
      current: location.pathname.startsWith('/management/users')
    },
    {
      name: 'Role Management',
      href: '/management/roles',
      icon: Shield,
      current: location.pathname.startsWith('/management/roles')
    },
    {
      name: 'GitHub Management',
      href: '/management/github',
      icon: Github,
      current: location.pathname.startsWith('/management/github'),
      requiresPlatformAdmin: true
    },
    {
      name: 'Bulk Migration',
      href: '/migration',
      icon: Upload,
      current: location.pathname.startsWith('/migration')
    }
  ];


  return (
    <>
      {/* Mobile sidebar overlay */}
      {open && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:inset-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">CAMS</span>
          </div>
          
          {/* Close button for mobile */}
          <button
            onClick={() => setOpen(false)}
            aria-label="Close navigation menu"
            className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 md:hidden"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-8" aria-label="Main navigation">
          {/* Main navigation */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Main
            </h3>
            <div className="mt-2 space-y-1">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) => `
                    group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${isActive 
                      ? 'bg-primary-600 text-white' 
                      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                  aria-current={item.current ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  <item.icon className="flex-shrink-0 w-5 h-5 mr-3" aria-hidden="true" />
                  {item.name}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Management navigation - Only show to Admin/PlatformAdmin users */}
          {isAdmin && (
            <div>
              <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Management
              </h3>
              <div className="mt-2 space-y-1">
                {managementItems
                  .filter(item => {
                    // Only show GitHub Management to Platform Admins
                    if (item.requiresPlatformAdmin) {
                      return isPlatformAdmin;
                    }
                    // Show other management items to all admins
                    return true;
                  })
                  .map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={({ isActive }) => `
                        group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                        ${isActive 
                          ? 'bg-primary-600 text-white' 
                          : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                        }
                      `}
                      aria-current={item.current ? 'page' : undefined}
                      onClick={() => setOpen(false)}
                    >
                      <item.icon className="flex-shrink-0 w-5 h-5 mr-3" aria-hidden="true" />
                      {item.name}
                    </NavLink>
                  ))
                }
              </div>
            </div>
          )}

          {/* Log navigation - Only show to PlatformAdmin users */}
          {isPlatformAdmin && (
            <div>
              <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Logs
              </h3>
              <div className="mt-2 space-y-1">
                {logItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) => `
                      group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                      ${isActive 
                        ? 'bg-primary-600 text-white' 
                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                    onClick={() => setOpen(false)}
                  >
                    <item.icon className="flex-shrink-0 w-5 h-5 mr-3" aria-hidden="true" />
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </div>
          )}

        </nav>
      </div>
    </>
  );
};

export default Sidebar;