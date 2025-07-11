import React, { useEffect, useRef, useState } from 'react';

import FeaturesSection from '../components/home/FeaturesSection';
import HeroSection from '../components/home/HeroSection';
import IntegrationsSection from '../components/home/IntegrationsSection';
import NavigationHeader from '../components/home/NavigationHeader';
import ScrollToTop from '../components/home/ScrollToTop';
import Footer from '../components/layout/Footer';
import SEOHead from '../components/SEO/SEOHead';

const HomePage: React.FC = () => {
  const [gradientPosition, setGradientPosition] = useState({ x: 1.2, y: 0.5 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateGradientPosition = () => {
      setGradientPosition(prev => {
        // Move from right to left (1.0 to 0.0)
        let newX = prev.x - 0.008; // Smooth, consistent movement
        let newY = prev.y + (Math.random() - 0.5) * 0.002;
        
        // Seamless wrapping: when it reaches 0, wrap back to 1
        if (newX <= 0) {
          newX = 1;
        }
        
        // Keep Y within reasonable bounds
        newY = Math.max(0.3, Math.min(0.7, newY));
        
        return { x: newX, y: newY };
      });
    };

    const interval = setInterval(updateGradientPosition, 32); // Slightly slower for smoother animation
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
    { name: 'About Us', href: '/about', isRoute: true },
    { name: 'Features', href: '/features', isRoute: true },
    { name: 'Integrations', href: '/integrations', isRoute: true },
    { name: 'Documentation', href: '/documentation', isRoute: true },
    { name: 'Pricing', href: '/pricing', isRoute: true },
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

      <Footer />

      <ScrollToTop
        showScrollTop={showScrollTop}
        scrollToTop={scrollToTop}
      />
    </div>
  );
};

export default HomePage;