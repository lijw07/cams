import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { usePageTracking } from './hooks/usePageTracking';
import { logSEOStatus } from './utils/seoValidation';
import { PerformanceMonitor } from './utils/webVitals';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ContactSales from './pages/ContactSales';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import ApplicationDetail from './pages/ApplicationDetail';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import HomePage from './pages/HomePage';

// Management pages
import UserManagement from './pages/management/UserManagement';
import CreateUser from './pages/management/CreateUser';
import EditUser from './pages/management/EditUser';
import RoleManagement from './pages/management/RoleManagement';
import BulkMigration from './pages/migration/BulkMigration';

// Log pages
import AuditLogs from './pages/logs/AuditLogs';
import SystemLogs from './pages/logs/SystemLogs';
import SecurityLogs from './pages/logs/SecurityLogs';
import PerformanceLogs from './pages/logs/PerformanceLogs';

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public route component (redirect to dashboard if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

const App: React.FC = () => {
  // Enable automatic page tracking
  usePageTracking();

  // SEO validation in development
  useEffect(() => {
    logSEOStatus();
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <PerformanceMonitor />
        <Routes>
        {/* Home page - accessible to all */}
        <Route path="/" element={<HomePage />} />
        
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route path="/contact-sales" element={<ContactSales />} />
        
        {/* Protected routes with layout */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Application routes */}
          <Route path="applications" element={<Applications />} />
          <Route path="applications/:id" element={<ApplicationDetail />} />
          
          {/* Profile routes */}
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          
          {/* Management routes */}
          <Route path="management/users" element={<UserManagement />} />
          <Route path="management/users/create" element={<CreateUser />} />
          <Route path="management/users/:id/edit" element={<EditUser />} />
          <Route path="management/roles" element={<RoleManagement />} />
          
          {/* Migration routes */}
          <Route path="migration" element={<BulkMigration />} />
          
          {/* Log routes */}
          <Route path="logs/audit" element={<AuditLogs />} />
          <Route path="logs/system" element={<SystemLogs />} />
          <Route path="logs/security" element={<SecurityLogs />} />
          <Route path="logs/performance" element={<PerformanceLogs />} />
        </Route>
        
        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </div>
    </ErrorBoundary>
  );
};

export default App;