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

/**
 * Validate name fields (first name, last name)
 */
export function validateName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  
  const trimmed = name.trim();
  
  // Must be 1-50 characters
  if (trimmed.length < 1 || trimmed.length > 50) return false;
  
  // Only allow letters, spaces, hyphens, apostrophes, and accented characters
  const namePattern = /^[\p{L}\s\-']+$/u;
  return namePattern.test(trimmed);
}

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  // Basic email validation pattern
  const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailPattern.test(email)) return false;
  
  // Additional length checks
  if (email.length > 254) return false;
  
  // Check for reasonable domain length
  const [, domain] = email.split('@');
  if (!domain || domain.length > 253) return false;
  
  return true;
}

/**
 * Validate bio/description text
 */
export function validateBio(bio: string): boolean {
  if (!bio) return true; // Bio is optional
  if (typeof bio !== 'string') return false;
  
  const trimmed = bio.trim();
  
  // Must be less than 500 characters
  if (trimmed.length > 500) return false;
  
  // Check for potentially malicious content
  const maliciousPatterns = [
    /<script[^>]*>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi,
    /<embed[^>]*>/gi,
    /<object[^>]*>/gi
  ];
  
  for (const pattern of maliciousPatterns) {
    if (pattern.test(bio)) return false;
  }
  
  return true;
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): boolean {
  if (!password || typeof password !== 'string') return false;
  
  // Must be at least 8 characters
  if (password.length < 8) return false;
  
  // Must contain at least one lowercase letter
  if (!/[a-z]/.test(password)) return false;
  
  // Must contain at least one uppercase letter
  if (!/[A-Z]/.test(password)) return false;
  
  // Must contain at least one number
  if (!/\d/.test(password)) return false;
  
  // Must contain at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)) return false;
  
  return true;
}

/**
 * Validate image file for upload
 */
export function validateImageFile(file: File): boolean {
  if (!file || !(file instanceof File)) return false;
  
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) return false;
  
  // Check file size (5MB max)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) return false;
  
  // Check filename for suspicious patterns
  const filename = file.name.toLowerCase();
  const suspiciousPatterns = [
    /\.php$/,
    /\.js$/,
    /\.html$/,
    /\.exe$/,
    /\.bat$/,
    /\.sh$/
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(filename)) return false;
  }
  
  return true;
}

/**
 * Sanitize HTML content to prevent XSS
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/[<>"'&]/g, (match) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[match] || match;
    })
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}
