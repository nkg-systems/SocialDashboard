/**
 * Input validation utilities for security and data integrity
 */

// Valid platform names (should match backend)
const VALID_PLATFORMS = ['twitter', 'facebook', 'instagram', 'linkedin', 'tiktok', 'youtube'] as const;
type ValidPlatform = typeof VALID_PLATFORMS[number];

// UUID v4 regex pattern
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate platform name
 */
export function validatePlatform(platform: string): platform is ValidPlatform {
  return VALID_PLATFORMS.includes(platform as ValidPlatform);
}

/**
 * Validate UUID format
 */
export function validateUUID(id: string): boolean {
  return UUID_PATTERN.test(id);
}

/**
 * Validate account ID (must be UUID)
 */
export function validateAccountId(accountId: string): boolean {
  return validateUUID(accountId);
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
    .slice(0, 1000); // Limit length
}

/**
 * Validate OAuth state parameter
 */
export function validateOAuthState(state: string): boolean {
  // State should be base64url safe characters only
  return /^[A-Za-z0-9_-]+$/.test(state) && state.length >= 32;
}

/**
 * Validate OAuth code parameter
 */
export function validateOAuthCode(code: string): boolean {
  // Authorization codes should be alphanumeric and reasonable length
  return /^[A-Za-z0-9_-]+$/.test(code) && code.length >= 10 && code.length <= 512;
}

/**
 * Secure error message filtering
 * Removes sensitive information from error messages before displaying to user
 */
export function sanitizeErrorMessage(error: string): string {
  // Remove sensitive patterns
  const sensitivePatterns = [
    /token[s]?[:=]\s*[^\s,}]+/gi,
    /key[s]?[:=]\s*[^\s,}]+/gi,
    /secret[s]?[:=]\s*[^\s,}]+/gi,
    /password[s]?[:=]\s*[^\s,}]+/gi,
    /Bearer\s+[^\s,}]+/gi,
    /[a-f0-9]{32,}/gi, // Potential hashes/tokens
  ];

  let sanitized = error;
  sensitivePatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });

  return sanitized;
}

/**
 * Validate API endpoint path
 */
export function validateApiEndpoint(endpoint: string): boolean {
  // Should start with /api/v1 and contain only safe characters
  return /^\/api\/v\d+\/[\w\/-]+$/.test(endpoint);
}

/**
 * Rate limit checker for API calls
 */
class RateLimiter {
  private calls: Map<string, number[]> = new Map();
  
  constructor(
    private maxCalls: number = 60,
    private windowMs: number = 60000 // 1 minute
  ) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.calls.has(identifier)) {
      this.calls.set(identifier, []);
    }
    
    const callTimes = this.calls.get(identifier)!;
    
    // Remove old calls outside the window
    const recentCalls = callTimes.filter(time => time > windowStart);
    
    if (recentCalls.length >= this.maxCalls) {
      return false;
    }
    
    // Add current call
    recentCalls.push(now);
    this.calls.set(identifier, recentCalls);
    
    return true;
  }
}

// Global rate limiter instance
export const apiRateLimiter = new RateLimiter();

/**
 * Check if URL is safe for redirection
 */
export function isSafeRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    
    // Only allow HTTPS in production, HTTP allowed for localhost
    const allowedProtocols = ['https:'];
    if (process.env.NODE_ENV === 'development') {
      allowedProtocols.push('http:');
    }
    
    if (!allowedProtocols.includes(parsed.protocol)) {
      return false;
    }
    
    // Check for allowed hosts (configure based on your requirements)
    const allowedHosts = [
      'localhost',
      '127.0.0.1',
      // Add your production domains here
    ];
    
    return allowedHosts.some(host => 
      parsed.hostname === host || 
      parsed.hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

/**
 * Sanitize input to prevent XSS and script injection
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/[<>"'&]/g, (match) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[match];
    })
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate post content for security and platform requirements
 */
export function validatePostContent(content: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!content || content.trim().length === 0) {
    errors.push('Post content cannot be empty');
    return { isValid: false, errors };
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script[^>]*>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi,
    /<embed[^>]*>/gi,
    /<object[^>]*>/gi
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      errors.push('Content contains potentially unsafe elements');
      break;
    }
  }
  
  // Check content length (different limits for different platforms)
  if (content.length > 2800) {
    errors.push('Content too long for cross-platform posting');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate image URL for security and format
 */
export function validateImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const parsed = new URL(url);
    
    // Only allow HTTPS (and HTTP for development)
    const allowedProtocols = ['https:'];
    if (process.env.NODE_ENV === 'development') {
      allowedProtocols.push('http:');
    }
    
    if (!allowedProtocols.includes(parsed.protocol)) {
      return false;
    }
    
    // Check for valid image file extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const hasValidExtension = imageExtensions.some(ext => 
      parsed.pathname.toLowerCase().includes(ext)
    );
    
    // Also accept URLs without extensions if they're from known image hosts
    const knownImageHosts = [
      'images.unsplash.com',
      'cdn.pixabay.com',
      'i.imgur.com',
      'media.giphy.com',
      'picsum.photos'
    ];
    
    const isKnownImageHost = knownImageHosts.some(host => 
      parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
    );
    
    return hasValidExtension || isKnownImageHost;
  } catch {
    return false;
  }
}
