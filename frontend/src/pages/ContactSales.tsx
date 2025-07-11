import React from 'react';
import { useContactSales } from '../hooks/useContactSales';
import ContactBackground from '../components/contact/ContactBackground';
import ContactHeader from '../components/contact/ContactHeader';
import ContactForm from '../components/contact/ContactForm';
import ContactInfo from '../components/contact/ContactInfo';
import ContactSuccessPage from '../components/contact/ContactSuccessPage';
import SEOHead from '../components/SEO/SEOHead';

const ContactSales: React.FC = () => {
  const {
    isSubmitting,
    isSubmitted,
    setIsSubmitted,
    mousePosition,
    form,
    onSubmit
  } = useContactSales();

  if (isSubmitted) {
    return <ContactSuccessPage onReset={() => setIsSubmitted(false)} />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <SEOHead
        title="Contact Sales - CAMS Enterprise Database Management Solutions"
        description="Get enterprise pricing and custom solutions for CAMS. Talk to our sales team about your database management, API integration, and monitoring needs. Schedule a demo today."
        keywords="CAMS contact sales, enterprise database management, custom pricing, sales demo, database solutions, API integration pricing, enterprise support"
        canonical="/contact-sales"
      />
      <ContactBackground mousePosition={mousePosition} />
      
      <div className="relative z-10 min-h-screen">
        <ContactHeader />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <ContactForm 
              form={form}
              onSubmit={onSubmit}
              isSubmitting={isSubmitting}
            />
            <ContactInfo />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSales;