import React from 'react'

import { HelmetProvider } from 'react-helmet-async'
import { QueryClientProvider } from 'react-query'
import { BrowserRouter } from 'react-router-dom'

import ReactDOM from 'react-dom/client'

import App from './App'
import { validateEnvironment } from './config/environment'
import { queryClient } from './config/queryClient'
import { AnalyticsProvider } from './contexts/AnalyticsContext'
import { AuthProvider } from './contexts/AuthContext'
import { ModalProvider } from './contexts/ModalContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { ThemeProvider } from './contexts/ThemeContext'
import './index.css'

// Validate environment configuration on startup
try {
  validateEnvironment();
} catch (error) {
  console.error('Environment validation failed:', error);
  // In production, you might want to show a user-friendly error page
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider>
            <ModalProvider>
              <NotificationProvider>
                <AuthProvider>
                  <AnalyticsProvider>
                    <App />
                  </AnalyticsProvider>
                </AuthProvider>
              </NotificationProvider>
            </ModalProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>,
)