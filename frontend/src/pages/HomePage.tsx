import React, { useEffect, useRef, useState } from 'react';
import NavigationHeader from '../components/home/NavigationHeader';
import HeroSection from '../components/home/HeroSection';
import FeaturesSection from '../components/home/FeaturesSection';
import IntegrationsSection from '../components/home/IntegrationsSection';
import ScrollToTop from '../components/home/ScrollToTop';
import SEOHead from '../components/SEO/SEOHead';

const HomePage: React.FC = () => {
  const [gradientPosition, setGradientPosition] = useState({ x: 1.2, y: 0.5 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateGradientPosition = () => {
      setGradientPosition(prev => {
        let newX = prev.x - 0.005;
        let newY = prev.y + (Math.random() - 0.5) * 0.01;
        
        if (newX < -0.2) {
          newX = 1.2;
          newY = Math.random();
        }
        
        return { x: newX, y: newY };
      });
    };

    const interval = setInterval(updateGradientPosition, 16);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems = [
    { name: 'About Us', href: '#about' },
    { name: 'Features', href: '#features' },
    { name: 'Integrations', href: '#tools' },
    { name: 'Documentation', href: '#docs' },
    { name: 'Pricing', href: '#pricing' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-secondary-900">
      <SEOHead
        title="CAMS - Centralized Application Management System"
        description="Streamline your database operations with CAMS. Connect to SQL Server, MySQL, PostgreSQL, Oracle, MongoDB and more. Real-time monitoring, enterprise security, and cloud integration for modern teams."
        keywords="database management system, application monitoring, database connections, SQL Server, MySQL, PostgreSQL, Oracle, MongoDB, Redis, cloud integration, enterprise security, real-time monitoring, team collaboration, DevOps tools"
        type="website"
      />
      <NavigationHeader
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        navItems={navItems}
      />

      <HeroSection
        gradientPosition={gradientPosition}
        heroRef={heroRef}
      />

      <FeaturesSection />

      <IntegrationsSection />

      <ScrollToTop
        showScrollTop={showScrollTop}
        scrollToTop={scrollToTop}
      />
    </div>
  );
};

export default HomePage;