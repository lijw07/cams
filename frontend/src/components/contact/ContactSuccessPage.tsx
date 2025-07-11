import React from 'react';
import { CheckCircle } from 'lucide-react';

interface ContactSuccessPageProps {
  onReset: () => void;
}

const ContactSuccessPage: React.FC<ContactSuccessPageProps> = ({ onReset }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-3xl blur-xl"></div>
          <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Thank You!</h2>
            <p className="text-gray-300 mb-6">
              We've received your request and our sales team will contact you within 24 hours.
            </p>
            <button
              onClick={onReset}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSuccessPage;