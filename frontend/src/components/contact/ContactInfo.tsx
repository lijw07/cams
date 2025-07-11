import React from 'react';

import { Mail, Phone, Clock, CheckCircle } from 'lucide-react';

import { benefits } from '../../constants/contactSalesData';

const ContactInfo: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Contact Information */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-3xl blur-xl"></div>
        <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
          <h3 className="text-2xl font-bold text-white mb-6">Get in Touch</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Mail className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <div className="text-white font-medium">Email</div>
                <div className="text-gray-300">sales@cams.com</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Phone className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <div className="text-white font-medium">Phone</div>
                <div className="text-gray-300">+1 (555) 123-CAMS</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Clock className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <div className="text-white font-medium">Response Time</div>
                <div className="text-gray-300">Within 24 hours</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-3xl blur-xl"></div>
        <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
          <h3 className="text-2xl font-bold text-white mb-6">Why Choose CAMS?</h3>
          <div className="space-y-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0 p-2 bg-white/10 rounded-lg">
                  <benefit.icon className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">{benefit.title}</h4>
                  <p className="text-gray-300 text-sm">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enterprise Features */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 to-purple-600/10 rounded-3xl blur-xl"></div>
        <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
          <h3 className="text-2xl font-bold text-white mb-6">Enterprise Ready</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-gray-300">99.9% Uptime SLA</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-gray-300">24/7 Premium Support</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-gray-300">SOC 2 Type II Compliance</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-gray-300">Single Sign-On (SSO)</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-gray-300">Advanced Analytics</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-gray-300">Custom Integrations</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactInfo;