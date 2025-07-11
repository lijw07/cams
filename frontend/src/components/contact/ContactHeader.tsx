import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ContactHeader: React.FC = () => {
  return (
    <div className="text-center py-16 px-4">
      {/* Back to Home Button */}
      <div className="mb-12">
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300 group shadow-lg hover:shadow-xl"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="font-medium">Back to Home</span>
        </Link>
      </div>
      <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
        Ready to Transform Your
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          {' '}Data Infrastructure?
        </span>
      </h1>
      <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
        Join thousands of organizations using CAMS to streamline their database operations, 
        enhance security, and accelerate innovation.
      </p>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
        <div className="text-center">
          <div className="text-3xl font-bold text-white">500+</div>
          <div className="text-sm text-gray-400">Enterprise Clients</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-white">99.9%</div>
          <div className="text-sm text-gray-400">Uptime SLA</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-white">10M+</div>
          <div className="text-sm text-gray-400">Connections Managed</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-white">24/7</div>
          <div className="text-sm text-gray-400">Expert Support</div>
        </div>
      </div>
    </div>
  );
};

export default ContactHeader;