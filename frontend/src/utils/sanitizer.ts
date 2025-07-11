import DOMPurify from 'dompurify';
import { SANITIZATION_CONFIG } from '../config/security';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param dirty - The potentially unsafe HTML string
 * @param options - Optional DOMPurify configuration
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(
  dirty: string,
  options?: DOMPurify.Config
): string {
  const config: DOMPurify.Config = {
    ALLOWED_TAGS: SANITIZATION_CONFIG.allowedTags,
    ALLOWED_ATTR: Object.keys(SANITIZATION_CONFIG.allowedAttributes).reduce(
      (acc, tag) => {
        SANITIZATION_CONFIG.allowedAttributes[tag as keyof typeof SANITIZATION_CONFIG.allowedAttributes]?.forEach(
          attr => acc.push(`${tag}-${attr}`)
        );
        return acc;
      },
      [] as string[]
    ),
    ...options,
  };

  // Add hook to transform tags
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // Transform anchor tags
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });

  const clean = DOMPurify.sanitize(dirty, config);

  // Remove hook after use
  DOMPurify.removeHook('afterSanitizeAttributes');

  return clean;
}

/**
 * Sanitizes user input for display (escapes HTML)
 * @param input - User input string
 * @returns Escaped string safe for display
 */
export function sanitizeText(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Validates and sanitizes URL
 * @param url - URL to validate
 * @param allowedProtocols - Allowed URL protocols
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(
  url: string,
  allowedProtocols: string[] = ['http:', 'https:', 'mailto:']
): string {
  try {
    const parsed = new URL(url);
    if (allowedProtocols.includes(parsed.protocol)) {
      return parsed.toString();
    }
  } catch {
    // Invalid URL
  }
  return '';
}

/**
 * Sanitizes filename to prevent path traversal
 * @param filename - Original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove any path separators and special characters
  return filename
    .replace(/[/\\]/g, '')
    .replace(/\.{2,}/g, '.')
    .replace(/[^a-zA-Z0-9.\-_]/g, '_')
    .slice(0, 255); // Limit length
}

/**
 * Sanitizes object keys and values recursively
 * @param obj - Object to sanitize
 * @param maxDepth - Maximum recursion depth
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  maxDepth: number = 10
): T {
  if (maxDepth <= 0) {
    throw new Error('Maximum recursion depth exceeded');
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = sanitizeText(key);
    
    if (typeof value === 'string') {
      result[sanitizedKey] = sanitizeText(value);
    } else if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        result[sanitizedKey] = value.map(item => 
          typeof item === 'string' 
            ? sanitizeText(item) 
            : typeof item === 'object' && item !== null
            ? sanitizeObject(item as Record<string, unknown>, maxDepth - 1)
            : item
        );
      } else {
        result[sanitizedKey] = sanitizeObject(
          value as Record<string, unknown>,
          maxDepth - 1
        );
      }
    } else {
      result[sanitizedKey] = value;
    }
  }

  return result as T;
}