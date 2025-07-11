import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  gradientPosition: { x: number; y: number };
  heroRef: React.RefObject<HTMLDivElement>;
}

const HeroSection: React.FC<HeroSectionProps> = ({ gradientPosition, heroRef }) => {
  const navigate = useNavigate();

  return (
    <section 
      ref={heroRef}
      className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{
        background: `radial-gradient(circle at ${gradientPosition.x * 100}% ${gradientPosition.y * 100}%, 
          rgba(139, 92, 246, 0.3) 0%, 
          rgba(59, 130, 246, 0.2) 25%, 
          rgba(16, 185, 129, 0.1) 50%, 
          transparent 70%)`
      }}
    >
      <div className="max-w-7xl mx-auto text-center relative">
        <div className="mb-6">
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-800">
            <Sparkles className="w-4 h-4 mr-2" />
            New: External API Integrations Available
          </span>
        </div>
        
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 mb-8 leading-tight">
          Centralized Application Management System
        </h1>
        
        <p className="text-xl md:text-2xl text-secondary-600 dark:text-secondary-300 mb-12 max-w-4xl mx-auto leading-relaxed">
          Streamline your application ecosystem with our comprehensive platform for database connections, 
          API integrations, user management, and real-time monitoring.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <button 
            onClick={() => navigate('/auth/register')}
            className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-600 to-purple-600 text-white font-semibold text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-primary-700 to-purple-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            <span className="relative flex items-center">
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </span>
          </button>
          
          <button 
            onClick={() => navigate('/contact-sales')}
            className="inline-flex items-center px-8 py-4 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white border-2 border-secondary-200 dark:border-secondary-700 font-semibold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Contact Sales
          </button>
        </div>
        
        <div className="mt-16 text-sm text-secondary-500 dark:text-secondary-400">
          <p>Trusted by enterprise teams • 99.9% uptime • SOC 2 compliant</p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;