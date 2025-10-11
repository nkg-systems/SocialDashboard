/**
 * Authentication Error Page
 * NextAuth error handling page with user-friendly error messages
 */

'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const AuthErrorPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'Configuration':
        return {
          title: 'Server Configuration Error',
          description: 'There is a problem with the authentication configuration. Please contact support.',
          action: 'Contact Support'
        };
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          description: 'You do not have permission to access this application. Contact your administrator if you believe this is an error.',
          action: 'Contact Administrator'
        };
      case 'Verification':
        return {
          title: 'Verification Failed',
          description: 'The verification link is invalid or has expired. Please try signing in again.',
          action: 'Try Again'
        };
      case 'Default':
        return {
          title: 'Authentication Error',
          description: 'An error occurred during authentication. Please try signing in again.',
          action: 'Try Again'
        };
      case 'OAuthSignin':
      case 'OAuthCallback':
      case 'OAuthCreateAccount':
      case 'EmailCreateAccount':
      case 'Callback':
        return {
          title: 'OAuth Authentication Error',
          description: 'There was an error connecting to the authentication provider. Please try again or use a different sign-in method.',
          action: 'Try Different Method'
        };
      case 'OAuthAccountNotLinked':
        return {
          title: 'Account Not Linked',
          description: 'This email address is already associated with another account. Please sign in with your original method.',
          action: 'Use Original Method'
        };
      case 'EmailSignin':
        return {
          title: 'Email Authentication Error',
          description: 'Unable to send authentication email. Please check your email address and try again.',
          action: 'Check Email'
        };
      case 'CredentialsSignin':
        return {
          title: 'Invalid Credentials',
          description: 'The email or password you entered is incorrect. Please check your credentials and try again.',
          action: 'Try Again'
        };
      case 'SessionRequired':
        return {
          title: 'Session Required',
          description: 'You need to be signed in to access this page.',
          action: 'Sign In'
        };
      default:
        return {
          title: 'Authentication Error',
          description: 'An unexpected error occurred during authentication. Please try again.',
          action: 'Try Again'
        };
    }
  };

  const errorInfo = getErrorMessage(error);

  const handleAction = () => {
    // Redirect to sign in page for most errors
    router.push('/auth/signin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Error Icon */}
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <svg 
              className="w-8 h-8 text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-text-primary mb-2">
            {errorInfo.title}
          </h1>
          
          <p className="text-text-muted mb-8">
            {errorInfo.description}
          </p>
        </div>

        {/* Error Details */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
              <span className="text-sm text-red-800">
                Error Code: <code className="bg-red-100 px-1 rounded text-xs">{error}</code>
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleAction}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent hover:bg-accent-hover focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors duration-200"
          >
            {errorInfo.action}
          </button>

          <Link 
            href="/"
            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors duration-200"
          >
            Go to Home
          </Link>
        </div>

        {/* Help Section */}
        <div className="text-center text-xs text-text-muted mt-8">
          <p className="mb-2">
            Still having trouble? 
          </p>
          <div className="space-x-4">
            <a href="/help" className="text-accent hover:underline">
              Get Help
            </a>
            <a href="/contact" className="text-accent hover:underline">
              Contact Support
            </a>
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center text-xs text-text-muted border-t border-gray-200 pt-4">
          <p>
            If you believe this error is suspicious, please{' '}
            <a href="/security/report" className="text-accent hover:underline">
              report it to our security team
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthErrorPage;