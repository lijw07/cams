import React, { useEffect, lazy, Suspense } from 'react';

import { Routes, Route, Navigate } from 'react-router-dom';

import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingSpinner from './components/common/LoadingSpinner';
import Layout from './components/layout/Layout';
import { useAuth } from './contexts/AuthContext';
import { usePageTracking } from './hooks/usePageTracking';
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import HomePage from './pages/HomePage';
import { initializeCSPMonitoring } from './utils/cspHelper';
import { logSEOStatus } from './utils/seoValidation';
import { PerformanceMonitor } from './utils/webVitals';

// Eagerly loaded pages (frequently accessed)

// Lazy loaded pages
const Register = lazy(() => import('./pages/auth/Register'));
const ContactSales = lazy(() => import('./pages/ContactSales'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const Features = lazy(() => import('./pages/Features'));
const Integrations = lazy(() => import('./pages/Integrations'));
const Documentation = lazy(() => import('./pages/Documentation'));
const Pricing = lazy(() => import('./pages/Pricing'));
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
const GitHubManagement = lazy(() => import('./pages/management/GitHubManagement'));

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
        <Route path="/about" element={<AboutUs />} />
        <Route path="/features" element={<Features />} />
        <Route path="/integrations" element={<Integrations />} />
        <Route path="/documentation" element={<Documentation />} />
        <Route path="/pricing" element={<Pricing />} />
        
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
          <Route path="management/github" element={<GitHubManagement />} />
          
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