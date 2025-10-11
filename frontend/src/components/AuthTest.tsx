/**
 * Authentication Test Component
 * Used to validate NextAuth integration and security utilities
 */

'use client';

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSecurityUtils, useGenerateAssetId, useAuditLog } from '../utils/security';

const AuthTest: React.FC = () => {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    signIn, 
    signOut, 
    hasPermission, 
    isRole 
  } = useAuth();

  const {
    getCurrentUser,
    getCurrentUserId,
    verifyResourceOwnership,
    hasPermission: securityHasPermission
  } = useSecurityUtils();

  const generateAssetId = useGenerateAssetId();
  const auditLogger = useAuditLog();

  const handleTestActions = () => {
    try {
      // Test security utilities
      const currentUser = getCurrentUser();
      console.log('Current User:', currentUser);

      if (currentUser) {
        const userId = getCurrentUserId();
        console.log('User ID:', userId);

        // Test asset ID generation
        const assetId = generateAssetId('test');
        console.log('Generated Asset ID:', assetId);

        // Test permissions
        console.log('Has write permission:', securityHasPermission('write'));
        console.log('Has admin permission:', securityHasPermission('admin'));
        console.log('Has delete permission:', securityHasPermission('delete'));

        // Test resource ownership
        console.log('Owns resource (self):', verifyResourceOwnership(userId));
        console.log('Owns resource (other):', verifyResourceOwnership('other-user-id'));

        // Test audit logging
        auditLogger.log('AUTH_TEST', 'security_utilities', true, { testData: 'validation' });
      }
    } catch (error) {
      console.error('Test error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          <span className="ml-2 text-text-muted">Loading authentication status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm space-y-6">
      <h2 className="text-xl font-semibold text-text-primary">
        🔐 Authentication Test Component
      </h2>

      {/* Authentication Status */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-text-primary">Authentication Status</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Authenticated:</span>{' '}
            <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
              {isAuthenticated ? '✓ Yes' : '✗ No'}
            </span>
          </div>
          <div>
            <span className="font-medium">Loading:</span>{' '}
            <span className={isLoading ? 'text-yellow-600' : 'text-green-600'}>
              {isLoading ? '⏳ Yes' : '✓ No'}
            </span>
          </div>
        </div>
      </div>

      {/* User Information */}
      {isAuthenticated && user ? (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-text-primary">User Information</h3>
          <div className="bg-gray-50 p-4 rounded-md space-y-2 text-sm">
            <div><span className="font-medium">ID:</span> <code className="bg-gray-200 px-1 rounded">{user.id}</code></div>
            <div><span className="font-medium">Email:</span> {user.email}</div>
            <div><span className="font-medium">Name:</span> {user.name || 'Not provided'}</div>
            <div><span className="font-medium">Role:</span> <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">{user.role}</span></div>
            <div>
              <span className="font-medium">Permissions:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {user.permissions.map(permission => (
                  <span key={permission} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                    {permission}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-text-primary">Sign In Required</h3>
          <p className="text-text-muted">Please sign in to view user information and test security features.</p>
        </div>
      )}

      {/* Permission Tests */}
      {isAuthenticated && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-text-primary">Permission Tests</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Can Read:</span>{' '}
              <span className={hasPermission('read') ? 'text-green-600' : 'text-red-600'}>
                {hasPermission('read') ? '✓ Yes' : '✗ No'}
              </span>
            </div>
            <div>
              <span className="font-medium">Can Write:</span>{' '}
              <span className={hasPermission('write') ? 'text-green-600' : 'text-red-600'}>
                {hasPermission('write') ? '✓ Yes' : '✗ No'}
              </span>
            </div>
            <div>
              <span className="font-medium">Can Delete Own:</span>{' '}
              <span className={hasPermission('delete_own') ? 'text-green-600' : 'text-red-600'}>
                {hasPermission('delete_own') ? '✓ Yes' : '✗ No'}
              </span>
            </div>
            <div>
              <span className="font-medium">Can Delete:</span>{' '}
              <span className={hasPermission('delete') ? 'text-green-600' : 'text-red-600'}>
                {hasPermission('delete') ? '✓ Yes' : '✗ No'}
              </span>
            </div>
            <div>
              <span className="font-medium">Is Admin:</span>{' '}
              <span className={isRole('admin') ? 'text-green-600' : 'text-red-600'}>
                {isRole('admin') ? '✓ Yes' : '✗ No'}
              </span>
            </div>
            <div>
              <span className="font-medium">Is User:</span>{' '}
              <span className={isRole('user') ? 'text-green-600' : 'text-red-600'}>
                {isRole('user') ? '✓ Yes' : '✗ No'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-text-primary">Actions</h3>
        <div className="flex flex-wrap gap-2">
          {!isAuthenticated ? (
            <button
              onClick={() => signIn()}
              className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-hover transition-colors duration-200"
            >
              Sign In
            </button>
          ) : (
            <>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
              >
                Sign Out
              </button>
              <button
                onClick={handleTestActions}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                Test Security Utils
              </button>
            </>
          )}
        </div>
      </div>

      {/* Test Results */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-text-primary">Test Instructions</h3>
        <div className="text-sm text-text-muted space-y-2">
          <p>1. <strong>Sign In:</strong> Click "Sign In" to test authentication flow</p>
          <p>2. <strong>Test Credentials:</strong> Use admin@socialdashboard.com / admin123! or user@socialdashboard.com / user123!</p>
          <p>3. <strong>Check Permissions:</strong> Notice how permissions differ between admin and user roles</p>
          <p>4. <strong>Test Security Utils:</strong> Click "Test Security Utils" and check browser console</p>
          <p>5. <strong>Sign Out:</strong> Test the sign out flow</p>
        </div>
      </div>
    </div>
  );
};

export default AuthTest;