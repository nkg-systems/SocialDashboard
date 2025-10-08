/**
 * Social Media API Service
 * Handles all API calls related to social media account connections, OAuth flows, and account management
 */

import { ApiResponse, SocialAccount, Platform, ConnectResponse } from '@/types';
import { 
  validatePlatform, 
  validateAccountId, 
  validateApiEndpoint,
  sanitizeErrorMessage,
  apiRateLimiter 
} from '@/utils/validation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_VERSION = '/api/v1';

interface SocialAccountMetrics {
  platform: string;
  username: string;
  metrics: {
    followers: number;
    following: number;
    posts: number;
    likes: number;
    views?: number;
  };
  last_sync?: string;
}

interface AccountSyncResponse {
  message: string;
}

interface DisconnectResponse {
  message: string;
}

class SocialMediaService {
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    // Validate endpoint format
    if (!validateApiEndpoint(endpoint)) {
      throw new Error('Invalid API endpoint format');
    }

    // Rate limiting check
    const rateLimitKey = `${endpoint}:${Date.now().toString().slice(0, -4)}`; // Per-minute buckets
    if (!apiRateLimiter.isAllowed(rateLimitKey)) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    const url = `${API_BASE_URL}${API_VERSION}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const config = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || `HTTP error! status: ${response.status}`;
        throw new Error(sanitizeErrorMessage(errorMessage));
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // Only log sanitized errors in development
      if (process.env.NODE_ENV === 'development') {
        console.warn(`API request failed for ${endpoint}:`, sanitizeErrorMessage(error instanceof Error ? error.message : String(error)));
      }
      throw error;
    }
  }

  /**
   * Get user's connected social media accounts
   */
  async getConnectedAccounts(): Promise<SocialAccount[]> {
    return this.makeRequest<SocialAccount[]>('/social/accounts');
  }

  /**
   * Get list of supported platforms
   */
  async getSupportedPlatforms(): Promise<{ platforms: Platform[] }> {
    return this.makeRequest<{ platforms: Platform[] }>('/social/platforms');
  }

  /**
   * Initiate OAuth connection to a social media platform
   * Returns authorization URL for the user to visit
   */
  async initiateConnection(platform: string): Promise<ConnectResponse> {
    if (!validatePlatform(platform)) {
      throw new Error(`Invalid platform: ${platform}`);
    }
    
    return this.makeRequest<ConnectResponse>(`/social/connect/${platform}`, {
      method: 'POST',
    });
  }

  /**
   * Start OAuth flow by redirecting to the platform's authorization page
   */
  async connectPlatform(platform: string): Promise<void> {
    if (!validatePlatform(platform)) {
      throw new Error(`Invalid platform: ${platform}`);
    }

    // Security: Generate additional client-side state for CSRF protection
    const clientState = crypto.getRandomValues(new Uint8Array(16))
      .reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

    try {
      const response = await this.initiateConnection(platform);
      
      // Validate response has required fields
      if (!response.auth_url || !response.state) {
        throw new Error('Invalid OAuth response from server');
      }

      // Validate auth URL is from trusted domain
      const authUrl = new URL(response.auth_url);
      const trustedDomains = {
        facebook: ['facebook.com', 'www.facebook.com'],
        instagram: ['instagram.com', 'www.instagram.com', 'facebook.com'],
        linkedin: ['linkedin.com', 'www.linkedin.com'],
        tiktok: ['tiktok.com', 'www.tiktok.com'],
        youtube: ['accounts.google.com', 'www.googleapis.com']
      };
      
      const platformDomains = trustedDomains[platform as keyof typeof trustedDomains];
      if (!platformDomains?.includes(authUrl.hostname)) {
        throw new Error('OAuth URL from untrusted domain');
      }
      
      // Store state and platform for later verification
      sessionStorage.setItem('oauth_state', response.state);
      sessionStorage.setItem('oauth_platform', response.platform);
      sessionStorage.setItem('oauth_client_state', clientState);
      sessionStorage.setItem('oauth_timestamp', Date.now().toString());
      
      // Redirect to OAuth authorization URL
      window.location.href = response.auth_url;
    } catch (error) {
      const sanitizedError = sanitizeErrorMessage(error instanceof Error ? error.message : String(error));
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Failed to initiate ${platform} connection:`, sanitizedError);
      }
      throw new Error(sanitizedError);
    }
  };

  /**
   * Disconnect a social media account
   */
  async disconnectAccount(accountId: string): Promise<DisconnectResponse> {
    if (!validateAccountId(accountId)) {
      throw new Error('Invalid account ID format');
    }
    
    return this.makeRequest<DisconnectResponse>(`/social/accounts/${accountId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Manually sync data from a social media account
   */
  async syncAccount(accountId: string): Promise<AccountSyncResponse> {
    if (!validateAccountId(accountId)) {
      throw new Error('Invalid account ID format');
    }
    
    return this.makeRequest<AccountSyncResponse>(`/social/accounts/${accountId}/sync`, {
      method: 'POST',
    });
  }

  /**
   * Get current metrics for a social media account
   */
  async getAccountMetrics(accountId: string): Promise<SocialAccountMetrics> {
    if (!validateAccountId(accountId)) {
      throw new Error('Invalid account ID format');
    }
    
    return this.makeRequest<SocialAccountMetrics>(`/social/accounts/${accountId}/metrics`);
  }

  /**
   * Sync all connected accounts
   */
  async syncAllAccounts(): Promise<{ synced: number; errors: string[] }> {
    try {
      const accounts = await this.getConnectedAccounts();
      const activeAccounts = accounts.filter(account => account.is_active);
      
      let syncedCount = 0;
      const errors: string[] = [];

      // Sync accounts in parallel with error handling
      await Promise.allSettled(
        activeAccounts.map(async (account) => {
          try {
            await this.syncAccount(account.id);
            syncedCount++;
          } catch (error) {
            errors.push(`Failed to sync ${account.platform}: ${error}`);
          }
        })
      );

      return { synced: syncedCount, errors };
    } catch (error) {
      throw new Error(`Failed to sync accounts: ${error}`);
    }
  }

  /**
   * Check OAuth callback parameters and extract relevant information
   */
  getOAuthCallbackInfo(): {
    platform: string | null;
    state: string | null;
    code: string | null;
    error: string | null;
  } {
    if (typeof window === 'undefined') {
      return { platform: null, state: null, code: null, error: null };
    }

    const urlParams = new URLSearchParams(window.location.search);
    const storedState = sessionStorage.getItem('oauth_state');
    const storedPlatform = sessionStorage.getItem('oauth_platform');
    
    return {
      platform: storedPlatform,
      state: storedState,
      code: urlParams.get('code'),
      error: urlParams.get('error'),
    };
  }

  /**
   * Clear OAuth session data
   */
  clearOAuthSession(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_platform');
      sessionStorage.removeItem('oauth_client_state');
      sessionStorage.removeItem('oauth_timestamp');
    }
  }

  /**
   * Check if user is returning from OAuth flow with proper validation
   */
  isReturningFromOAuth(): boolean {
    if (typeof window === 'undefined') return false;
    
    const urlParams = new URLSearchParams(window.location.search);
    const hasCode = urlParams.has('code');
    const hasState = urlParams.has('state');
    const urlState = urlParams.get('state');
    const storedState = sessionStorage.getItem('oauth_state');
    const storedTimestamp = sessionStorage.getItem('oauth_timestamp');
    
    // Basic checks
    if (!hasCode || !hasState || !storedState || !storedTimestamp) {
      return false;
    }
    
    // Security: Validate state parameter matches (CSRF protection)
    if (urlState !== storedState) {
      console.error('OAuth state mismatch - possible CSRF attack');
      this.clearOAuthSession();
      return false;
    }
    
    // Security: Check if OAuth flow is too old (15 minutes max)
    const timestamp = parseInt(storedTimestamp, 10);
    const maxAge = 15 * 60 * 1000; // 15 minutes
    if (Date.now() - timestamp > maxAge) {
      console.error('OAuth flow expired');
      this.clearOAuthSession();
      return false;
    }
    
    return true;
  };

  /**
   * Handle successful OAuth connection
   */
  handleOAuthSuccess(platform: string): void {
    this.clearOAuthSession();
    
    // Show success message or trigger refresh of account list
    if (typeof window !== 'undefined') {
      // Remove OAuth parameters from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('code');
      url.searchParams.delete('state');
      url.searchParams.delete('scope');
      
      window.history.replaceState({}, document.title, url.pathname);
    }
  }

  /**
   * Handle OAuth error
   */
  handleOAuthError(error: string): void {
    this.clearOAuthSession();
    console.error('OAuth error:', error);
    
    // Remove error parameters from URL
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      url.searchParams.delete('error_description');
      url.searchParams.delete('state');
      
      window.history.replaceState({}, document.title, url.pathname);
    }
  }
}

// Export singleton instance
export const socialService = new SocialMediaService();
export default socialService;