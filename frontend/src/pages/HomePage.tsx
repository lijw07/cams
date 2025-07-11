import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Database, 
  Shield, 
  Zap, 
  Cloud, 
  BarChart3, 
  Users, 
  ArrowRight,
  Sparkles,
  Menu,
  X,
  Github,
  Twitter,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  Heart,
  ChevronUp,
  Server,
  Globe,
  Code,
  FileText,
  DollarSign,
  Check
} from 'lucide-react';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [gradientPosition, setGradientPosition] = useState({ x: 1.2, y: 0.5 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateGradientPosition = () => {
      setGradientPosition(prev => {
        let newX = prev.x - 0.005; // Move left by 0.5% each update for smoother motion
        let newY = prev.y + (Math.random() - 0.5) * 0.01; // Smaller vertical movement
        
        // Reset to right side when it goes off the left
        if (newX < -0.2) {
          newX = 1.2;
          newY = Math.random(); // Random Y position when resetting
        }
        
        return { x: newX, y: newY };
      });
    };

    // Update position every 16ms for smooth 60fps movement
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
    { name: 'Supported Tools', href: '#tools' },
    { name: 'Documentation', href: '#docs' },
    { name: 'Pricing', href: '#pricing' },
  ];

  const features = [
    {
      icon: Database,
      title: 'Multi-Database Support',
      description: 'Connect to SQL Server, MySQL, PostgreSQL, Oracle, MongoDB, and more with unified management.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Advanced encryption, role-based access control, and comprehensive audit logging.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Zap,
      title: 'Real-time Monitoring',
      description: 'Live performance metrics, automated alerts, and intelligent diagnostics.',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Cloud,
      title: 'Cloud Integration',
      description: 'Seamless integration with AWS, Azure, and Google Cloud Platform services.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reporting',
      description: 'Comprehensive dashboards, custom reports, and data visualization tools.',
      color: 'from-indigo-500 to-blue-500'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Share connections securely, manage team permissions, and track changes.',
      color: 'from-rose-500 to-pink-500'
    }
  ];

  const stats = [
    { label: 'Active Connections', value: '10,000+' },
    { label: 'Data Transferred', value: '50+ TB' },
    { label: 'Uptime', value: '99.9%' },
    { label: 'Global Users', value: '500+' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-white dark:from-secondary-900 dark:to-secondary-800">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-secondary-900/80 backdrop-blur-lg border-b border-secondary-200/50 dark:border-secondary-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                  CAMS
                </h1>
                <p className="text-xs text-secondary-500 dark:text-secondary-400">Database Management</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={item.action || (() => document.querySelector(item.href)?.scrollIntoView({ behavior: 'smooth' }))}
                  className="text-secondary-600 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors duration-200 relative group"
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-500 to-purple-500 group-hover:w-full transition-all duration-300"></span>
                </button>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="text-secondary-600 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors duration-200"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-primary-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-primary-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-secondary-600 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors duration-200"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-300 ${mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden bg-white dark:bg-secondary-900 border-t border-secondary-200 dark:border-secondary-700`}>
          <div className="px-4 py-4 space-y-4">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  item.action ? item.action() : document.querySelector(item.href)?.scrollIntoView({ behavior: 'smooth' });
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-secondary-600 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium py-2 transition-colors duration-200"
              >
                {item.name}
              </button>
            ))}
            <div className="pt-4 border-t border-secondary-200 dark:border-secondary-700 space-y-3">
              <button
                onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                className="block w-full text-left text-secondary-600 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium py-2 transition-colors duration-200"
              >
                Login
              </button>
              <button
                onClick={() => { navigate('/register'); setMobileMenuOpen(false); }}
                className="w-full bg-gradient-to-r from-primary-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-primary-600 hover:to-purple-700 transition-all duration-200"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-purple-500/10" />
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at ${gradientPosition.x * 100}% ${gradientPosition.y * 100}%, rgba(var(--color-primary-500), 0.15) 0%, transparent 50%)`,
            }}
          />
          
          {/* Floating particles */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-primary-500/20 rounded-full"
              style={{
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <div className="space-y-8">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-sm font-medium">
              <Sparkles className="w-4 h-4 mr-2" />
              Next-generation database management
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-secondary-900 dark:text-white leading-tight">
              Connect, Monitor,
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">
                {' '}Scale
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-secondary-600 dark:text-secondary-300 max-w-3xl mx-auto leading-relaxed">
              Streamline your database operations with our comprehensive connection and application management system. 
              Monitor performance, ensure security, and scale with confidence.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => navigate('/applications')}
                className="inline-flex items-center px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-xl"
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-secondary-900 dark:text-white">{stat.value}</div>
                <div className="text-sm text-secondary-600 dark:text-secondary-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* About Us Section */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-secondary-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-6">
              About CAMS
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-300 max-w-3xl mx-auto">
              Born from the need to simplify complex database management, CAMS revolutionizes how teams handle their data infrastructure.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-2">Enterprise-Grade Security</h3>
                  <p className="text-secondary-600 dark:text-secondary-300">Built with security-first principles, featuring end-to-end encryption, role-based access control, and comprehensive audit trails.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-2">Lightning Fast Performance</h3>
                  <p className="text-secondary-600 dark:text-secondary-300">Optimized for speed with intelligent caching, connection pooling, and real-time monitoring to keep your systems running smoothly.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-2">Team Collaboration</h3>
                  <p className="text-secondary-600 dark:text-secondary-300">Designed for teams with shared workspaces, permission management, and real-time collaboration features.</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-3xl p-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">500+</div>
                    <div className="text-sm text-secondary-600 dark:text-secondary-400">Enterprise Clients</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">99.9%</div>
                    <div className="text-sm text-secondary-600 dark:text-secondary-400">Uptime Guarantee</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">10M+</div>
                    <div className="text-sm text-secondary-600 dark:text-secondary-400">Queries Processed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">24/7</div>
                    <div className="text-sm text-secondary-600 dark:text-secondary-400">Expert Support</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-6">
              Everything you need to manage your data infrastructure
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-300 max-w-3xl mx-auto">
              From connection management to performance monitoring, CAMS provides all the tools you need 
              to keep your databases running smoothly and securely.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative p-8 bg-white dark:bg-secondary-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-secondary-200 dark:border-secondary-700"
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} mb-6`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-4">
                  {feature.title}
                </h3>
                
                <p className="text-secondary-600 dark:text-secondary-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Tools Section */}
      <section id="tools" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary-50 dark:bg-secondary-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-6">
              Supported Database Tools
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-300 max-w-3xl mx-auto">
              Connect to any database technology with our comprehensive support for major database systems and cloud platforms.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {[
              { name: 'SQL Server', logo: '🔷', color: 'from-blue-500 to-blue-600' },
              { name: 'MySQL', logo: '🐬', color: 'from-orange-500 to-orange-600' },
              { name: 'PostgreSQL', logo: '🐘', color: 'from-blue-600 to-indigo-600' },
              { name: 'Oracle', logo: '🔴', color: 'from-red-500 to-red-600' },
              { name: 'MongoDB', logo: '🍃', color: 'from-green-500 to-green-600' },
              { name: 'Redis', logo: '⚡', color: 'from-red-400 to-red-500' },
              { name: 'AWS RDS', logo: '☁️', color: 'from-yellow-500 to-orange-500' },
              { name: 'Azure SQL', logo: '🔷', color: 'from-blue-400 to-blue-500' },
              { name: 'Google Cloud', logo: '🌐', color: 'from-blue-500 to-green-500' },
              { name: 'SQLite', logo: '📦', color: 'from-gray-500 to-gray-600' },
              { name: 'Cassandra', logo: '🗄️', color: 'from-purple-500 to-purple-600' },
              { name: 'REST APIs', logo: '🔗', color: 'from-indigo-500 to-purple-500' },
            ].map((tool, index) => (
              <div
                key={index}
                className="group bg-white dark:bg-secondary-700 rounded-2xl p-6 text-center shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${tool.color} rounded-xl flex items-center justify-center text-2xl shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110`}>
                  {tool.logo}
                </div>
                <h3 className="font-semibold text-secondary-900 dark:text-white">{tool.name}</h3>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-secondary-600 dark:text-secondary-400 mb-6">
              Don't see your database? We're constantly adding new integrations.
            </p>
            <button className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-600 text-white font-medium rounded-lg hover:from-primary-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105">
              Request Integration
              <ArrowRight className="ml-2 w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Documentation Section */}
      <section id="docs" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-6">
              Documentation & Resources
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-300 max-w-3xl mx-auto">
              Everything you need to get started, from quick setup guides to advanced configuration tutorials.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-secondary-800 rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-secondary-200 dark:border-secondary-700">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6">
                <Code className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-4">
                Quick Start Guide
              </h3>
              <p className="text-secondary-600 dark:text-secondary-300 mb-6">
                Get up and running in minutes with our step-by-step setup guide and basic configuration.
              </p>
              <button className="text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200">
                Read Guide →
              </button>
            </div>

            <div className="bg-white dark:bg-secondary-800 rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-secondary-200 dark:border-secondary-700">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-6">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-4">
                API Reference
              </h3>
              <p className="text-secondary-600 dark:text-secondary-300 mb-6">
                Comprehensive API documentation with examples, endpoints, and integration patterns.
              </p>
              <button className="text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200">
                View API Docs →
              </button>
            </div>

            <div className="bg-white dark:bg-secondary-800 rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-secondary-200 dark:border-secondary-700">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-4">
                Community Forum
              </h3>
              <p className="text-secondary-600 dark:text-secondary-300 mb-6">
                Join our community of developers, share tips, and get help from CAMS experts.
              </p>
              <button className="text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200">
                Join Community →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary-50 dark:bg-secondary-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-6">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-300 max-w-3xl mx-auto">
              Choose the plan that fits your team size and requirements. Scale up or down anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <div className="bg-white dark:bg-secondary-700 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-secondary-200 dark:border-secondary-600">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">Starter</h3>
                <div className="text-4xl font-bold text-secondary-900 dark:text-white mb-2">
                  $29<span className="text-lg text-secondary-500">/month</span>
                </div>
                <p className="text-secondary-600 dark:text-secondary-400">Perfect for small teams</p>
              </div>
              <ul className="space-y-4 mb-8">
                {['Up to 5 database connections', '10GB data transfer', 'Basic monitoring', 'Email support', 'Standard security'].map((feature) => (
                  <li key={feature} className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-secondary-700 dark:text-secondary-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <button className="w-full py-3 px-6 bg-secondary-100 dark:bg-secondary-600 text-secondary-900 dark:text-white font-medium rounded-xl hover:bg-secondary-200 dark:hover:bg-secondary-500 transition-colors duration-200">
                Start Free Trial
              </button>
            </div>

            {/* Professional Plan */}
            <div className="bg-gradient-to-br from-primary-500 to-purple-600 rounded-3xl p-8 shadow-xl transform scale-105 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Professional</h3>
                <div className="text-4xl font-bold text-white mb-2">
                  $99<span className="text-lg text-purple-200">/month</span>
                </div>
                <p className="text-purple-200">For growing businesses</p>
              </div>
              <ul className="space-y-4 mb-8">
                {['Unlimited database connections', '100GB data transfer', 'Advanced monitoring & alerts', 'Priority support', 'Enterprise security', 'Custom integrations'].map((feature) => (
                  <li key={feature} className="flex items-center">
                    <Check className="w-5 h-5 text-green-300 mr-3 flex-shrink-0" />
                    <span className="text-white">{feature}</span>
                  </li>
                ))}
              </ul>
              <button className="w-full py-3 px-6 bg-white text-primary-600 font-medium rounded-xl hover:bg-gray-50 transition-colors duration-200">
                Start Free Trial
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white dark:bg-secondary-700 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-secondary-200 dark:border-secondary-600">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">Enterprise</h3>
                <div className="text-4xl font-bold text-secondary-900 dark:text-white mb-2">
                  Custom
                </div>
                <p className="text-secondary-600 dark:text-secondary-400">For large organizations</p>
              </div>
              <ul className="space-y-4 mb-8">
                {['Everything in Professional', 'Unlimited data transfer', 'Dedicated support manager', 'SLA guarantees', 'Custom deployment', 'Training & onboarding'].map((feature) => (
                  <li key={feature} className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-secondary-700 dark:text-secondary-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <button className="w-full py-3 px-6 bg-gradient-to-r from-primary-500 to-purple-600 text-white font-medium rounded-xl hover:from-primary-600 hover:to-purple-700 transition-all duration-200">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-primary-600 to-purple-600 rounded-3xl p-12 text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to transform your database management?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of developers and organizations who trust CAMS for their critical data infrastructure.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/contact-sales')}
                className="inline-flex items-center px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200"
              >
                Contact Sales
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-secondary-900 dark:bg-black text-white overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-purple-900/20 to-secondary-900"></div>
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/10 rounded-full animate-pulse"
              style={{
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                animationDelay: Math.random() * 3 + 's',
                animationDuration: (Math.random() * 2 + 1) + 's'
              }}
            />
          ))}
        </div>
        
        <div className="relative z-10">
          {/* Main Footer Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              {/* Company Info */}
              <div className="lg:col-span-2">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Database className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
                      CAMS
                    </h3>
                    <p className="text-sm text-secondary-400">Centralized Application Management System</p>
                  </div>
                </div>
                <p className="text-secondary-300 mb-6 max-w-md leading-relaxed">
                  Revolutionizing database management with cutting-edge technology. 
                  Connect, monitor, and scale your data infrastructure with confidence.
                </p>
                <div className="flex space-x-4">
                  <a href="#" className="group p-3 bg-secondary-800 hover:bg-primary-600 rounded-lg transition-all duration-300 transform hover:scale-110">
                    <Github className="w-5 h-5 text-secondary-300 group-hover:text-white transition-colors duration-300" />
                  </a>
                  <a href="#" className="group p-3 bg-secondary-800 hover:bg-blue-600 rounded-lg transition-all duration-300 transform hover:scale-110">
                    <Twitter className="w-5 h-5 text-secondary-300 group-hover:text-white transition-colors duration-300" />
                  </a>
                  <a href="#" className="group p-3 bg-secondary-800 hover:bg-blue-700 rounded-lg transition-all duration-300 transform hover:scale-110">
                    <Linkedin className="w-5 h-5 text-secondary-300 group-hover:text-white transition-colors duration-300" />
                  </a>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="text-lg font-semibold mb-6 text-white">Quick Links</h4>
                <ul className="space-y-3">
                  {['Applications', 'Dashboard', 'Settings', 'User Management', 'Logs'].map((item) => (
                    <li key={item}>
                      <button className="text-secondary-300 hover:text-primary-400 transition-colors duration-200 text-left group">
                        <span className="relative">
                          {item}
                          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-400 group-hover:w-full transition-all duration-300"></span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h4 className="text-lg font-semibold mb-6 text-white">Contact Us</h4>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-secondary-300">
                    <div className="p-2 bg-secondary-800 rounded-lg">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="text-sm">support@cams.dev</span>
                  </div>
                  <div className="flex items-center space-x-3 text-secondary-300">
                    <div className="p-2 bg-secondary-800 rounded-lg">
                      <Phone className="w-4 h-4" />
                    </div>
                    <span className="text-sm">+1 (555) 123-4567</span>
                  </div>
                  <div className="flex items-center space-x-3 text-secondary-300">
                    <div className="p-2 bg-secondary-800 rounded-lg">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className="text-sm">San Francisco, CA</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-secondary-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <div className="flex items-center space-x-2 text-secondary-400 text-sm">
                  <span>© 2024 CAMS. Made with</span>
                  <Heart className="w-4 h-4 text-red-500 animate-pulse" />
                  <span>for developers worldwide.</span>
                </div>
                <div className="flex space-x-6 text-sm">
                  <a href="#" className="text-secondary-400 hover:text-primary-400 transition-colors duration-200">
                    Privacy Policy
                  </a>
                  <a href="#" className="text-secondary-400 hover:text-primary-400 transition-colors duration-200">
                    Terms of Service
                  </a>
                  <a href="#" className="text-secondary-400 hover:text-primary-400 transition-colors duration-200">
                    Cookie Policy
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-50 p-3 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform ${
          showScrollTop ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-16 opacity-0 scale-0'
        }`}
      >
        <ChevronUp className="w-6 h-6" />
      </button>
    </div>
  );
};

export default HomePage;