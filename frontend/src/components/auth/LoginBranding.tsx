import React from 'react';

import { Database, Shield, Zap, Sparkles } from 'lucide-react';

const LoginBranding: React.FC = () => {
  return (
    <div className="max-w-md">
      {/* Logo and branding */}
      <div className="flex items-center mb-8">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-75"></div>
          <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl">
            <Database className="h-8 w-8 text-white" />
          </div>
        </div>
        <div className="ml-4">
          <h1 className="text-3xl font-bold text-white">CAMS</h1>
          <p className="text-blue-200 text-sm">Centralized Application Management System</p>
        </div>
      </div>

      {/* Features */}
      <div className="space-y-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 p-2 bg-blue-500/20 rounded-lg">
            <Shield className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold mb-1">Enterprise Security</h3>
            <p className="text-gray-300 text-sm">Advanced encryption and role-based access control</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 p-2 bg-purple-500/20 rounded-lg">
            <Zap className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold mb-1">Real-time Monitoring</h3>
            <p className="text-gray-300 text-sm">Live performance metrics and intelligent diagnostics</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 p-2 bg-cyan-500/20 rounded-lg">
            <Sparkles className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold mb-1">Multi-Database Support</h3>
            <p className="text-gray-300 text-sm">Connect to any database with unified management</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-12 grid grid-cols-3 gap-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">10K+</div>
          <div className="text-sm text-gray-400">Active Connections</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">99.9%</div>
          <div className="text-sm text-gray-400">Uptime</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">500+</div>
          <div className="text-sm text-gray-400">Organizations</div>
        </div>
      </div>
    </div>
  );
};

export default LoginBranding;