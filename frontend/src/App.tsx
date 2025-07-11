import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { usePageTracking } from './hooks/usePageTracking';
import { logSEOStatus } from './utils/seoValidation';
import { PerformanceMonitor } from './utils/webVitals';
import { initializeCSPMonitoring } from './utils/cspHelper';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';
import Layout from './components/layout/Layout';

// Eagerly loaded pages (frequently accessed)
import HomePage from './pages/HomePage';
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';

// Lazy loaded pages
const Register = lazy(() => import('./pages/auth/Register'));
const ContactSales = lazy(() => import('./pages/ContactSales'));
const Applications = lazy(() => import('./pages/Applications'));
const ApplicationDetail = lazy(() => import('./pages/ApplicationDetail'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Management pages (admin only - lazy load)
const UserManagement = lazy(() => import('./pages/management/UserManagement'));
const CreateUser = lazy(() => import('./pages/management/CreateUser'));
const EditUser = lazy(() => import('./pages/management/EditUser'));
const RoleManagement = lazy(() => import('./pages/management/RoleManagement'));
const BulkMigration = lazy(() => import('./pages/migration/BulkMigration'));

// Log pages (platform admin only - lazy load)
const AuditLogs = lazy(() => import('./pages/logs/AuditLogs'));
const SystemLogs = lazy(() => import('./pages/logs/SystemLogs'));
const SecurityLogs = lazy(() => import('./pages/logs/SecurityLogs'));
const PerformanceLogs = lazy(() => import('./pages/logs/PerformanceLogs'));

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

  // Initialize security monitoring
  useEffect(() => {
    initializeCSPMonitoring();
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <PerformanceMonitor />
        <Suspense fallback={<LoadingSpinner />}>
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
        </Suspense>
      </div>
    </ErrorBoundary>
  );
};

export default App;