import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
  canonical?: string;
  structuredData?: object;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'CAMS - Centralized Application Management System',
  description = 'Streamline your database operations with CAMS. Connect to SQL Server, MySQL, PostgreSQL, Oracle, MongoDB and more. Real-time monitoring, enterprise security, and cloud integration for modern teams.',
  keywords = 'database management system, application monitoring, database connections, SQL Server, MySQL, PostgreSQL, Oracle, MongoDB, Redis, cloud integration, enterprise security, real-time monitoring, team collaboration, DevOps tools',
  image = '/images/cams-og-image.jpg',
  url,
  type = 'website',
  noIndex = false,
  canonical,
  structuredData
}) => {
  const fullTitle = title.includes('CAMS') ? title : `${title} | CAMS`;
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
  const fullImageUrl = image.startsWith('http') ? image : `${siteUrl}${image}`;
  const canonicalUrl = canonical || currentUrl;

  // Default structured data for CAMS application
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "CAMS - Centralized Application Management System",
    "description": description,
    "url": siteUrl,
    "applicationCategory": "DatabaseApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "Contact for pricing",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "author": {
      "@type": "Organization",
      "name": "CAMS Team",
      "url": siteUrl
    },
    "featureList": [
      "Multi-Database Support (SQL Server, MySQL, PostgreSQL, Oracle, MongoDB, Redis)",
      "Real-time Performance Monitoring", 
      "Enterprise-grade Security & Audit Logging",
      "Cloud Platform Integration (AWS, Azure, Google Cloud)",
      "Team Collaboration & Role Management",
      "Advanced Analytics & Reporting",
      "External API Integrations (GitHub, Slack, Jira, Salesforce)",
      "Automated Connection Testing & Health Monitoring"
    ],
    "screenshot": fullImageUrl,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "150"
    }
  };

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Robots Meta */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      )}
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:alt" content={title} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:site_name" content="CAMS" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:image:alt" content={title} />
      
      {/* Additional SEO Meta Tags */}
      <meta name="author" content="CAMS Team" />
      <meta name="publisher" content="CAMS" />
      <meta name="application-name" content="CAMS" />
      <meta name="theme-color" content="#3B82F6" />
      <meta name="msapplication-TileColor" content="#3B82F6" />
      
      {/* Performance and Security */}
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <meta name="format-detection" content="telephone=no" />
      
      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData || defaultStructuredData)}
      </script>
    </Helmet>
  );
};

export default SEOHead;