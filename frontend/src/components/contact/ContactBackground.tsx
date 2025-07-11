import React from 'react';

interface ContactBackgroundProps {
  mousePosition: { x: number; y: number };
}

const ContactBackground: React.FC<ContactBackgroundProps> = ({ mousePosition }) => {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div 
        className="absolute inset-0 opacity-30 transition-all duration-300"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(139, 69, 255, 0.4) 0%, transparent 50%)`
        }}
      />
      
      {/* Floating orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-2000" />
    </div>
  );
};

export default ContactBackground;