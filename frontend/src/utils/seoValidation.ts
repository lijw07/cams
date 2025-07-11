// SEO Validation utility for development and testing
export const validateSEO = () => {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check title
  const title = document.title;
  if (!title) {
    issues.push('Missing page title');
  } else if (title.length < 30) {
    recommendations.push('Title could be longer (30-60 characters optimal)');
  } else if (title.length > 60) {
    recommendations.push('Title is too long (over 60 characters)');
  }

  // Check meta description
  const description = document.querySelector('meta[name="description"]')?.getAttribute('content');
  if (!description) {
    issues.push('Missing meta description');
  } else if (description.length < 120) {
    recommendations.push('Meta description could be longer (120-160 characters optimal)');
  } else if (description.length > 160) {
    recommendations.push('Meta description is too long (over 160 characters)');
  }

  // Check Open Graph tags
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDescription = document.querySelector('meta[property="og:description"]');
  const ogImage = document.querySelector('meta[property="og:image"]');
  
  if (!ogTitle) issues.push('Missing Open Graph title');
  if (!ogDescription) issues.push('Missing Open Graph description');
  if (!ogImage) issues.push('Missing Open Graph image');

  // Check Twitter Card tags
  const twitterCard = document.querySelector('meta[name="twitter:card"]');
  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  const twitterDescription = document.querySelector('meta[name="twitter:description"]');
  
  if (!twitterCard) issues.push('Missing Twitter Card type');
  if (!twitterTitle) issues.push('Missing Twitter title');
  if (!twitterDescription) issues.push('Missing Twitter description');

  // Check structured data
  const structuredData = document.querySelector('script[type="application/ld+json"]');
  if (!structuredData) {
    issues.push('Missing structured data (JSON-LD)');
  }

  // Check canonical URL
  const canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    recommendations.push('Consider adding canonical URL');
  }

  return {
    issues,
    recommendations,
    score: Math.max(0, 100 - (issues.length * 10) - (recommendations.length * 5))
  };
};

// Development helper to log SEO status
export const logSEOStatus = () => {
  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => {
      const result = validateSEO();
      console.group('🔍 SEO Validation');
      console.log(`📊 SEO Score: ${result.score}/100`);
      
      if (result.issues.length > 0) {
        console.group('❌ Issues');
        result.issues.forEach(issue => console.error(issue));
        console.groupEnd();
      }
      
      if (result.recommendations.length > 0) {
        console.group('💡 Recommendations');
        result.recommendations.forEach(rec => console.warn(rec));
        console.groupEnd();
      }
      
      if (result.issues.length === 0 && result.recommendations.length === 0) {
        console.log('✅ All SEO checks passed!');
      }
      
      console.groupEnd();
    }, 1000); // Wait for React Helmet to inject meta tags
  }
};

export default { validateSEO, logSEOStatus };