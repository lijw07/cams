import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { usePageTracking } from './hooks/usePageTracking';
import LoadingSpinner from './components/common/LoadingSpinner';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import ApplicationDetail from './pages/ApplicationDetail';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

// Management pages
import UserManagement from './pages/management/UserManagement';
import RoleManagement from './pages/management/RoleManagement';
import EmailManagement from './pages/management/EmailManagement';
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

  return (
    <div className="min-h-screen">
      <Routes>
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
        
        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Application routes */}
          <Route path="applications" element={<Applications />} />
          <Route path="applications/:id" element={<ApplicationDetail />} />
          
          {/* Profile routes */}
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          
          {/* Management routes */}
          <Route path="management/users" element={<UserManagement />} />
          <Route path="management/roles" element={<RoleManagement />} />
          <Route path="management/emails" element={<EmailManagement />} />
          
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
  );
};

export default App;