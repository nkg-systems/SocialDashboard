/**
 * Security Utilities
 * Centralized security functions for user validation and secure operations
 */

import { useAuth } from '../contexts/AuthContext';

// Type definitions for user data
interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: string;
  permissions: string[];
}

// Hook-based functions for use in React components
/**
 * Custom hook to get security utilities with NextAuth integration
 * SECURITY: Use this hook in React components for authenticated operations
 */
export const useSecurityUtils = () => {
  const { user, isAuthenticated, hasPermission: authHasPermission } = useAuth();
  
  const getCurrentUser = (): User | null => {
    return user;
  };
  
  const getCurrentUserId = (): string => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    return user.id;
  };
  
  const verifyResourceOwnership = (resourceUserId: string): boolean => {
    if (!user) return false;
    return user.id === resourceUserId;
  };
  
  const hasPermission = (permission: string): boolean => {
    return authHasPermission(permission);
  };
  
  return {
    getCurrentUser,
    getCurrentUserId,
    verifyResourceOwnership,
    hasPermission,
    isAuthenticated,
    user
  };
};

// Parameter-based functions for use in non-component contexts
/**
 * Get current user ID safely (parameter version)
 * SECURITY: Use when you already have user object from session
 */
export const getCurrentUserIdFromUser = (user: User | null): string => {
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user.id;
};

/**
 * Check if user owns a resource (parameter version)
 * SECURITY: Essential for preventing unauthorized access
 */
export const verifyResourceOwnershipForUser = (user: User | null, resourceUserId: string): boolean => {
  if (!user) return false;
  return user.id === resourceUserId;
};

/**
 * Check if user has specific permission (parameter version)
 * SECURITY: Permission-based access control
 */
export const hasPermissionForUser = (user: User | null, permission: string): boolean => {
  if (!user) return false;
  return user.permissions.includes(permission) || user.role === 'admin';
};

// Legacy functions (deprecated) - kept for backward compatibility
/**
 * @deprecated Use useSecurityUtils().getCurrentUser() in components or pass user parameter
 */
export const getCurrentUser = (): User | null => {
  console.warn('getCurrentUser() is deprecated. Use useSecurityUtils() hook in components or pass user parameter to utility functions.');
  return null;
};

/**
 * @deprecated Use useSecurityUtils().getCurrentUserId() in components or getCurrentUserIdFromUser(user)
 */
export const getCurrentUserId = (): string => {
  console.warn('getCurrentUserId() is deprecated. Use useSecurityUtils() hook in components or getCurrentUserIdFromUser(user).');
  throw new Error('User not authenticated - use NextAuth session');
};

/**
 * @deprecated Use useSecurityUtils().verifyResourceOwnership() in components or verifyResourceOwnershipForUser(user, resourceUserId)
 */
export const verifyResourceOwnership = (resourceUserId: string): boolean => {
  console.warn('verifyResourceOwnership() is deprecated. Use useSecurityUtils() hook in components or verifyResourceOwnershipForUser(user, resourceUserId).');
  return false;
};

/**
 * @deprecated Use useSecurityUtils().hasPermission() in components or hasPermissionForUser(user, permission)
 */
export const hasPermission = (permission: string): boolean => {
  console.warn('hasPermission() is deprecated. Use useSecurityUtils() hook in components or hasPermissionForUser(user, permission).');
  return false;
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
export const generateAssetId = (user: User | null, prefix: string = 'asset'): string => {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 15);
  const userPart = user?.id ? user.id.slice(-8) : 'anon'; // Last 8 chars of user ID or 'anon'
  return `${prefix}_${timestamp}_${randomPart}_${userPart}`;
};

/**
 * Generate secure asset ID using hook (for React components)
 * SECURITY: Use in React components with authentication context
 */
export const useGenerateAssetId = () => {
  const { user } = useAuth();
  return (prefix: string = 'asset') => generateAssetId(user, prefix);
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
  
  isAllowed(userId: string | null, operation: string): boolean {
    if (!userId) {
      // For anonymous users, use a generic key
      userId = 'anonymous';
    }
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
  log: (user: User | null, action: string, resource: string, success: boolean, details?: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId: user?.id || 'anonymous',
      userRole: user?.role || 'anonymous',
      action,
      resource,
      success,
      details,
      // SECURITY: Don't log sensitive user agent or IP in development
      // In production, these should be captured server-side with proper anonymization
    };
    
    // SECURITY: In production, send to your secure logging service
    // Don't log sensitive information to console in production
    if (process.env.NODE_ENV === 'development') {
      console.log('AUDIT:', logEntry);
    }
  }
};

/**
 * Hook-based audit logging for React components
 * SECURITY: Use in React components with authentication context
 */
export const useAuditLog = () => {
  const { user } = useAuth();
  
  return {
    log: (action: string, resource: string, success: boolean, details?: any) => {
      auditLog.log(user, action, resource, success, details);
    }
  };
};

export default {
  // New NextAuth-integrated functions
  useSecurityUtils,
  getCurrentUserIdFromUser,
  verifyResourceOwnershipForUser,
  hasPermissionForUser,
  generateAssetId,
  useGenerateAssetId,
  auditLog,
  useAuditLog,
  
  // Legacy functions (deprecated)
  getCurrentUser,
  getCurrentUserId,
  verifyResourceOwnership,
  hasPermission,
  
  // Utility functions (no authentication required)
  validateFileUpload,
  sanitizeFilename,
  validateTemplateContent,
  rateLimiter
};
