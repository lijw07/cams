import { env } from '../config/environment';
import { CSP_DIRECTIVES } from '../config/security';

/**
 * Generates Content Security Policy header value from configuration
 * @returns CSP header string
 */
export function generateCSPHeader(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, values]) => {
      if (Array.isArray(values)) {
        return `${directive} ${values.join(' ')}`;
      }
      return `${directive} ${values}`;
    })
    .join('; ');
}

/**
 * Creates a CSP meta tag for the document
 * @returns HTMLMetaElement
 */
export function createCSPMetaTag(): HTMLMetaElement {
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = generateCSPHeader();
  return meta;
}

/**
 * Injects CSP meta tag into the document head
 */
export function injectCSPMetaTag(): void {
  // Check if CSP meta tag already exists
  const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (existingCSP) {
    // Update existing tag
    existingCSP.setAttribute('content', generateCSPHeader());
  } else {
    // Create and inject new tag
    const cspMeta = createCSPMetaTag();
    document.head.appendChild(cspMeta);
  }
}

/**
 * Reports CSP violations (for monitoring)
 * @param violation - CSP violation event
 */
export function reportCSPViolation(violation: SecurityPolicyViolationEvent): void {
  const report = {
    blockedUri: violation.blockedURI,
    violatedDirective: violation.violatedDirective,
    effectiveDirective: violation.effectiveDirective,
    originalPolicy: violation.originalPolicy,
    disposition: violation.disposition,
    documentUri: violation.documentURI,
    referrer: violation.referrer,
    statusCode: violation.statusCode,
    sourceFile: violation.sourceFile,
    lineNumber: violation.lineNumber,
    columnNumber: violation.columnNumber,
    timestamp: new Date().toISOString(),
  };

  // Log to console in development
  if (env.app.isDevelopment) {
    console.warn('CSP Violation:', report);
  }

  // TODO: Send to monitoring service in production
  if (env.app.isProduction) {
    // Example: Send to monitoring endpoint
    // fetch('/api/security/csp-report', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(report),
    // });
  }
}

/**
 * Initializes CSP monitoring
 */
export function initializeCSPMonitoring(): void {
  // Listen for CSP violations
  document.addEventListener('securitypolicyviolation', reportCSPViolation);
}