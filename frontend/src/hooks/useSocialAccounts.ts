/**
 * React hook for managing social media accounts
 * Handles fetching, connecting, disconnecting, and syncing social media accounts
 */

import { useState, useEffect, useCallback } from 'react';
import { SocialAccount, ConnectedAccount, SocialAccountMetrics } from '@/types';
import socialService from '@/services/socialService';

interface UseSocialAccountsReturn {
  // Data
  accounts: SocialAccount[];
  connectedAccounts: ConnectedAccount[];
  
  // Loading states
  loading: boolean;
  connecting: string | null;
  syncing: string | null;
  disconnecting: string | null;
  
  // Actions
  refreshAccounts: () => Promise<void>;
  connectAccount: (platformId: string) => Promise<void>;
  disconnectAccount: (accountId: string) => Promise<void>;
  syncAccount: (accountId: string) => Promise<void>;
  syncAllAccounts: () => Promise<void>;
  getAccountMetrics: (accountId: string) => Promise<SocialAccountMetrics>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

export function useSocialAccounts(): UseSocialAccountsReturn {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Convert backend SocialAccount to frontend ConnectedAccount format
  const convertToConnectedAccount = useCallback((account: SocialAccount): ConnectedAccount => {
    return {
      id: account.id,
      platformId: account.platform,
      username: account.username,
      displayName: account.display_name || account.username,
      followers: 0, // Will be populated from metrics
      profileImageUrl: account.profile_image_url,
      lastSync: account.last_sync_at || 'Never',
      status: account.is_active ? 'connected' : 'error',
      permissions: ['read', 'write'], // Simplified for now
    };
  }, []);

  const connectedAccounts = accounts
    .filter(account => account.is_active)
    .map(convertToConnectedAccount);

  // Fetch accounts from API
  const refreshAccounts = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const fetchedAccounts = await socialService.getConnectedAccounts();
      setAccounts(fetchedAccounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Connect to a platform
  const connectAccount = useCallback(async (platformId: string) => {
    // Rate limiting: prevent rapid connection attempts
    const lastAttemptKey = `last_connect_attempt_${platformId}`;
    const lastAttempt = sessionStorage.getItem(lastAttemptKey);
    const now = Date.now();
    
    if (lastAttempt && now - parseInt(lastAttempt, 10) < 5000) { // 5 second cooldown
      setError('Please wait a moment before trying to connect again');
      return;
    }
    
    sessionStorage.setItem(lastAttemptKey, now.toString());
    
    try {
      setError(null);
      setConnecting(platformId);
      
      // This will redirect the user to the OAuth page
      await socialService.connectPlatform(platformId);
      
    } catch (err) {
      // Clear the rate limit on error so user can retry immediately
      sessionStorage.removeItem(lastAttemptKey);
      setError(err instanceof Error ? err.message : `Failed to connect to ${platformId}`);
      console.error('Error connecting account:', err);
    } finally {
      setConnecting(null);
    }
  }, []);

  // Disconnect an account
  const disconnectAccount = useCallback(async (accountId: string) => {
    try {
      setError(null);
      setDisconnecting(accountId);
      
      await socialService.disconnectAccount(accountId);
      
      // Only update local state after successful API call
      setAccounts(prev => prev.filter(account => account.id !== accountId));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect account');
      console.error('Error disconnecting account:', err);
      // Don't remove from local state on error
    } finally {
      setDisconnecting(null);
    }
  }, []);

  // Sync a specific account
  const syncAccount = useCallback(async (accountId: string) => {
    try {
      setError(null);
      setSyncing(accountId);
      
      await socialService.syncAccount(accountId);
      
      // Only update the account's last sync time after successful sync
      const syncTime = new Date().toISOString();
      setAccounts(prev => prev.map(account => 
        account.id === accountId 
          ? { ...account, last_sync_at: syncTime }
          : account
      ));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync account');
      console.error('Error syncing account:', err);
      // Don't update sync time on error
    } finally {
      setSyncing(null);
    }
  }, []);

  // Sync all accounts
  const syncAllAccounts = useCallback(async () => {
    try {
      setError(null);
      setSyncing('all');
      
      const result = await socialService.syncAllAccounts();
      
      if (result.errors.length > 0) {
        setError(`Synced ${result.synced} accounts with ${result.errors.length} errors`);
      }
      
      // Refresh accounts to get updated sync times
      await refreshAccounts();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync accounts');
      console.error('Error syncing all accounts:', err);
    } finally {
      setSyncing(null);
    }
  }, [refreshAccounts]);

  // Get account metrics
  const getAccountMetrics = useCallback(async (accountId: string): Promise<SocialAccountMetrics> => {
    try {
      const metrics = await socialService.getAccountMetrics(accountId);
      
      // Update follower count in local state
      setAccounts(prev => prev.map(account => {
        if (account.id === accountId) {
          // Store follower count in a way that can be accessed later
          // This is a bit of a hack since SocialAccount doesn't have a followers field
          return account;
        }
        return account;
      }));
      
      return metrics;
    } catch (err) {
      console.error('Error fetching account metrics:', err);
      throw err;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check for OAuth callback on mount
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    const checkOAuthCallback = async () => {
      if (socialService.isReturningFromOAuth()) {
        const callbackInfo = socialService.getOAuthCallbackInfo();
        
        if (callbackInfo.error) {
          // Handle different OAuth error types with specific messages
          let errorMessage = 'Authentication failed';
          switch (callbackInfo.error) {
            case 'access_denied':
              errorMessage = 'Connection cancelled by user';
              break;
            case 'invalid_request':
              errorMessage = 'Invalid authentication request - please try again';
              break;
            case 'unauthorized_client':
              errorMessage = 'Application not authorized for this platform';
              break;
            case 'unsupported_response_type':
            case 'invalid_scope':
              errorMessage = 'Platform configuration error - please contact support';
              break;
            default:
              errorMessage = `Authentication error: ${callbackInfo.error}`;
          }
          
          socialService.handleOAuthError(callbackInfo.error);
          setError(errorMessage);
        } else if (callbackInfo.code && callbackInfo.platform) {
          // OAuth was successful, the backend will handle the callback
          socialService.handleOAuthSuccess(callbackInfo.platform);
          
          // Set temporary success state
          setError(null);
          
          // Wait a moment then refresh accounts
          timeoutId = setTimeout(async () => {
            try {
              await refreshAccounts();
              // TODO: Could add a success notification here if needed
            } catch (err) {
              setError('Connected successfully but failed to refresh account data. Please refresh the page.');
            }
          }, 1000);
        } else {
          // Incomplete callback - security issue
          socialService.handleOAuthError('incomplete_callback');
          setError('Authentication process incomplete - please try connecting again');
        }
      } else {
        // Normal load - just fetch accounts
        refreshAccounts();
      }
    };

    checkOAuthCallback();
    
    // Cleanup timeout on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [refreshAccounts]);

  return {
    // Data
    accounts,
    connectedAccounts,
    
    // Loading states
    loading,
    connecting,
    syncing,
    disconnecting,
    
    // Actions
    refreshAccounts,
    connectAccount,
    disconnectAccount,
    syncAccount,
    syncAllAccounts,
    getAccountMetrics,
    
    // Error handling
    error,
    clearError,
  };
}

export default useSocialAccounts;