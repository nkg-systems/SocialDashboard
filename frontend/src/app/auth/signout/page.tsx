/**
 * Sign Out Page
 * NextAuth-integrated logout page with secure session cleanup
 */

'use client';

import React, { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';

const SignOutPage: React.FC = () => {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      setError(null);

      // Perform sign out
      await signOut({
        callbackUrl: '/auth/signin',
        redirect: false
      });

      // Redirect manually after successful signout
      router.push('/auth/signin');
    } catch (err) {
      console.error('Sign out error:', err);
      setError('Failed to sign out. Please try again.');
      setIsSigningOut(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg 
              className="w-6 h-6 text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
              />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Sign Out
          </h2>
          
          {isAuthenticated && user ? (
            <p className="text-text-muted mb-6">
              Are you sure you want to sign out of your account?
              <br />
              <span className="font-medium text-text-primary">
                {user.email}
              </span>
            </p>
          ) : (
            <p className="text-text-muted mb-6">
              You are not currently signed in.
            </p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Sign Out Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {isAuthenticated ? (
          <div className="space-y-4">
            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors duration-200 ${
                isSigningOut
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
              }`}
            >
              {isSigningOut ? (
                <>
                  <svg 
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    ></circle>
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing out...
                </>
              ) : (
                'Yes, sign me out'
              )}
            </button>

            {/* Cancel Button */}
            <button
              onClick={handleCancel}
              disabled={isSigningOut}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => router.push('/auth/signin')}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent hover:bg-accent-hover focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors duration-200"
            >
              Go to Sign In
            </button>
          </div>
        )}

        {/* Security Notice */}
        <div className="text-center text-xs text-text-muted mt-6">
          <p>
            For your security, you will be automatically signed out after a period of inactivity.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignOutPage;