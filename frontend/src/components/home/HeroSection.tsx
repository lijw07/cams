import React from 'react';

import { useNavigate } from 'react-router-dom';

import { ArrowRight, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  gradientPosition: { x: number; y: number };
  heroRef: React.RefObject<HTMLDivElement>;
}

const HeroSection: React.FC<HeroSectionProps> = ({ gradientPosition, heroRef }) => {
  const navigate = useNavigate();

  const getOpacity = (x: number) => {
    // Normalize x to be between 0 and 1 for calculations
    const normalizedX = x % 1;
    
    // Full opacity in the center (0.2 to 0.8)
    if (normalizedX >= 0.2 && normalizedX <= 0.8) {
      return 1;
    }
    
    // Fade out as it approaches the left edge (0.8 to 1.0)
    if (normalizedX > 0.8) {
      return Math.max(0, (1.0 - normalizedX) / 0.2);
    }
    
    // Fade in as it comes from the right edge (0.0 to 0.2)
    if (normalizedX < 0.2) {
      return Math.max(0, normalizedX / 0.2);
    }
    
    return 0;
  };

  const opacity1 = getOpacity(gradientPosition.x);
  const opacity2 = getOpacity(gradientPosition.x + 1);

  return (
    <section 
      ref={heroRef}
      className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{
        background: `
          radial-gradient(circle at ${gradientPosition.x * 100}% ${gradientPosition.y * 100}%, 
            rgba(139, 92, 246, ${0.3 * opacity1}) 0%, 
            rgba(59, 130, 246, ${0.2 * opacity1}) 25%, 
            rgba(16, 185, 129, ${0.1 * opacity1}) 50%, 
            transparent 70%),
          radial-gradient(circle at ${(gradientPosition.x + 1) * 100}% ${gradientPosition.y * 100}%, 
            rgba(139, 92, 246, ${0.3 * opacity2}) 0%, 
            rgba(59, 130, 246, ${0.2 * opacity2}) 25%, 
            rgba(16, 185, 129, ${0.1 * opacity2}) 50%, 
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
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 mb-16 leading-relaxed pb-4">
          Centralized Application Management System
        </h1>
        
        <p className="text-xl md:text-2xl text-secondary-600 dark:text-secondary-300 mb-12 max-w-4xl mx-auto leading-relaxed">
          Streamline your application ecosystem with our comprehensive platform for database connections, 
          API integrations, user management, and real-time monitoring.
        </p>
        
        <div className="flex justify-center items-center">
          <button 
            onClick={() => navigate('/contact-sales')}
            className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-600 to-purple-600 text-white font-semibold text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-primary-700 to-purple-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            <span className="relative flex items-center">
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </span>
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