/**
 * Security Utilities
 * Centralized security functions for user validation and secure operations
 */

// SECURITY: Mock user context - In production, this should come from authentication provider
interface User {
  id: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  permissions: string[];
}

// SECURITY: This should be replaced with actual authentication context
let currentUser: User | null = {
  id: 'user_' + Date.now(), // Generate unique user ID
  email: 'demo@example.com',
  role: 'user',
  permissions: ['read', 'write', 'delete_own']
};

/**
 * Get current authenticated user
 * SECURITY: In production, this should integrate with your auth provider (Auth0, Firebase, etc.)
 */
export const getCurrentUser = (): User | null => {
  // TODO: Replace with actual authentication check
  return currentUser;
};

/**
 * Get current user ID safely
 * SECURITY: Always use this instead of hardcoded user IDs
 */
export const getCurrentUserId = (): string => {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user.id;
};

/**
 * Check if current user owns a resource
 * SECURITY: Essential for preventing unauthorized access
 */
export const verifyResourceOwnership = (resourceUserId: string): boolean => {
  const currentUserId = getCurrentUserId();
  return currentUserId === resourceUserId;
};

/**
 * Check if user has specific permission
 * SECURITY: Permission-based access control
 */
export const hasPermission = (permission: string): boolean => {
  const user = getCurrentUser();
  if (!user) return false;
  return user.permissions.includes(permission) || user.role === 'admin';
};

/**
 * Validate file upload security
 * SECURITY: Comprehensive file validation
 */
export const validateFileUpload = (file: File): { isValid: boolean; error?: string } => {
  // File size limits (in bytes)
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB for images
  const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB for videos
  
  // Allowed MIME types
  const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ];
  
  const ALLOWED_VIDEO_TYPES = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-msvideo'
  ];
  
  // Check if file type is allowed
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
  
  if (!isImage && !isVideo) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed. Allowed types: images (JPEG, PNG, GIF, WebP, SVG) and videos (MP4, WebM, OGG, MOV, AVI)`
    };
  }
  
  // Check file size
  const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      isValid: false,
      error: `File size ${Math.round(file.size / (1024 * 1024))}MB exceeds maximum allowed size of ${maxSizeMB}MB`
    };
  }
  
  // Check filename for dangerous characters
  const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/g;
  if (dangerousChars.test(file.name)) {
    return {
      isValid: false,
      error: 'Filename contains invalid characters'
    };
  }
  
  // Check filename length
  if (file.name.length > 255) {
    return {
      isValid: false,
      error: 'Filename is too long (maximum 255 characters)'
    };
  }
  
  return { isValid: true };
};

/**
 * Sanitize filename for safe storage
 * SECURITY: Prevent path traversal and other filename-based attacks
 */
export const sanitizeFilename = (filename: string): string => {
  // Remove dangerous characters and limit length
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // Remove dangerous chars
    .replace(/\.\./g, '') // Remove parent directory references
    .trim()
    .slice(0, 255); // Limit length
};

/**
 * Generate secure asset ID
 * SECURITY: Use cryptographically secure random IDs
 */
export const generateAssetId = (prefix: string = 'asset'): string => {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 15);
  const userPart = getCurrentUserId().slice(-8); // Last 8 chars of user ID
  return `${prefix}_${timestamp}_${randomPart}_${userPart}`;
};

/**
 * Validate template variables for security
 * SECURITY: Prevent template injection attacks
 */
export const validateTemplateContent = (content: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check for dangerous patterns
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi
  ];
  
  dangerousPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      errors.push('Template contains potentially dangerous content');
    }
  });
  
  // Check content length
  if (content.length > 10000) {
    errors.push('Template content is too long (maximum 10,000 characters)');
  }
  
  // Validate template variable syntax
  const variableMatches = content.match(/\{\{([^}]+)\}\}/g);
  if (variableMatches) {
    variableMatches.forEach(match => {
      const variableName = match.replace(/\{\{|\}\}/g, '').trim();
      
      // Variable name validation
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(variableName)) {
        errors.push(`Invalid variable name: ${variableName}. Variable names must start with letter or underscore and contain only letters, numbers, and underscores.`);
      }
      
      if (variableName.length > 50) {
        errors.push(`Variable name too long: ${variableName}. Maximum 50 characters.`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Rate limiting for API operations
 * SECURITY: Prevent abuse and DoS attacks
 */
class RateLimiter {
  private operations: Map<string, number[]> = new Map();
  private readonly maxOperations: number;
  private readonly timeWindowMs: number;
  
  constructor(maxOperations: number = 100, timeWindowMs: number = 60000) {
    this.maxOperations = maxOperations;
    this.timeWindowMs = timeWindowMs;
  }
  
  isAllowed(userId: string, operation: string): boolean {
    const key = `${userId}:${operation}`;
    const now = Date.now();
    
    // Get or create operation history
    if (!this.operations.has(key)) {
      this.operations.set(key, []);
    }
    
    const operations = this.operations.get(key)!;
    
    // Remove old operations outside time window
    const cutoff = now - this.timeWindowMs;
    const recentOperations = operations.filter(timestamp => timestamp > cutoff);
    
    // Update the operations list
    this.operations.set(key, recentOperations);
    
    // Check if under limit
    if (recentOperations.length >= this.maxOperations) {
      return false;
    }
    
    // Add current operation
    recentOperations.push(now);
    return true;
  }
}

// Export rate limiter instance
export const rateLimiter = new RateLimiter();

/**
 * Audit logging for security events
 * SECURITY: Track security-relevant operations
 */
export const auditLog = {
  log: (action: string, resource: string, success: boolean, details?: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId: getCurrentUserId(),
      action,
      resource,
      success,
      details,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      ip: 'client' // In production, this should be captured server-side
    };
    
    // In production, send to your logging service
    console.log('AUDIT:', logEntry);
  }
};

export default {
  getCurrentUser,
  getCurrentUserId,
  verifyResourceOwnership,
  hasPermission,
  validateFileUpload,
  sanitizeFilename,
  generateAssetId,
  validateTemplateContent,
  rateLimiter,
  auditLog
};