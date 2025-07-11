import React, { useState } from 'react';

import { Link } from 'react-router-dom';

import Footer from '../components/layout/Footer';
import NavigationHeader from '../components/home/NavigationHeader';
import SEOHead from '../components/SEO/SEOHead';

const Pricing: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'About Us', href: '/about', isRoute: true },
    { name: 'Features', href: '/features', isRoute: true },
    { name: 'Integrations', href: '/integrations', isRoute: true },
    { name: 'Documentation', href: '/documentation', isRoute: true },
    { name: 'Pricing', href: '/pricing', isRoute: true },
  ];

  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for small teams getting started',
      monthlyPrice: 29,
      annualPrice: 290,
      features: [
        'Up to 5 database connections',
        'Basic monitoring & alerts',
        'Standard support',
        'Role-based access control',
        'Audit logging',
        'SSL encryption',
      ],
      limitations: [
        'Limited to 3 team members',
        'Basic reporting',
        'Email support only',
      ],
      popular: false,
      cta: 'Start Free Trial'
    },
    {
      name: 'Professional',
      description: 'For growing teams with advanced needs',
      monthlyPrice: 79,
      annualPrice: 790,
      features: [
        'Up to 25 database connections',
        'Advanced monitoring & analytics',
        'Priority support',
        'Advanced security features',
        'Custom backup schedules',
        'API access',
        'Advanced reporting',
        'SSO integration',
        'Up to 15 team members',
      ],
      limitations: [],
      popular: true,
      cta: 'Start Free Trial'
    },
    {
      name: 'Enterprise',
      description: 'For large organizations with custom requirements',
      monthlyPrice: null,
      annualPrice: null,
      features: [
        'Unlimited database connections',
        'Enterprise monitoring & analytics',
        'Dedicated support manager',
        'Advanced compliance features',
        'Custom integrations',
        'On-premise deployment option',
        'Advanced security & governance',
        'Custom training & onboarding',
        'Unlimited team members',
        'SLA guarantees',
      ],
      limitations: [],
      popular: false,
      cta: 'Contact Sales'
    }
  ];

  const getPrice = (plan: typeof plans[0]) => {
    if (plan.monthlyPrice === null) return 'Custom';
    const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
    return `$${price}`;
  };

  const getPriceUnit = (plan: typeof plans[0]) => {
    if (plan.monthlyPrice === null) return '';
    return billingCycle === 'monthly' ? '/month' : '/year';
  };

  const getSavings = (plan: typeof plans[0]) => {
    if (plan.monthlyPrice === null || billingCycle === 'monthly') return null;
    const monthlyCost = plan.monthlyPrice * 12;
    const savings = monthlyCost - plan.annualPrice;
    const percentage = Math.round((savings / monthlyCost) * 100);
    return percentage;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-secondary-900">
      <SEOHead
        title="Pricing - CAMS"
        description="Choose the perfect CAMS plan for your team. From startups to enterprise, we have flexible pricing options for database management."
        keywords="CAMS pricing, database management pricing, enterprise database tools, team collaboration pricing"
        type="website"
      />
      
      <NavigationHeader
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        navItems={navItems}
        showNavItems={true}
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto">
              Choose the plan that fits your team's needs. No hidden fees, no surprises.
            </p>
          </div>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center mb-12">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'annual'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Annual
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                Save up to 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const savings = getSavings(plan);
            return (
              <div
                key={index}
                className={`rounded-2xl shadow-lg overflow-hidden ${
                  plan.popular
                    ? 'border-2 border-blue-500 relative'
                    : 'border border-gray-200 dark:border-gray-700'
                } bg-white dark:bg-gray-800`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {plan.description}
                  </p>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        {getPrice(plan)}
                      </span>
                      <span className="text-lg text-gray-600 dark:text-gray-300 ml-1">
                        {getPriceUnit(plan)}
                      </span>
                    </div>
                    {savings && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        Save {savings}% with annual billing
                      </p>
                    )}
                  </div>

                  <Link
                    to={plan.cta === 'Contact Sales' ? '/contact-sales' : '/contact-sales'}
                    className={`block w-full text-center py-3 px-4 rounded-lg font-medium transition-colors mb-6 ${
                      plan.popular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {plan.cta}
                  </Link>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      What's included:
                    </h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                          <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-gray-600 dark:text-gray-300 text-sm">
                            {feature}
                          </span>
                        </li>
                      ))}
                      {plan.limitations.map((limitation, limitationIndex) => (
                        <li key={limitationIndex} className="flex items-start">
                          <svg className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          <span className="text-gray-400 text-sm">
                            {limitation}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Have questions about our pricing? We're here to help.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Is there a free trial?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Yes! We offer a 14-day free trial for all plans. No credit card required to get started.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Can I change plans anytime?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect immediately.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  What payment methods do you accept?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  We accept all major credit cards, PayPal, and can arrange invoicing for Enterprise customers.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Do you offer discounts for non-profits?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Yes, we offer special pricing for educational institutions and non-profit organizations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 bg-gray-50 dark:bg-gray-800 rounded-2xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of teams who trust CAMS to manage their database operations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact-sales"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Start Free Trial
            </Link>
            <Link
              to="/contact-sales"
              className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Pricing;