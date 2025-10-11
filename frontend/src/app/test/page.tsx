/**
 * Authentication Test Page
 * Page dedicated to testing NextAuth integration and security utilities
 */

'use client';

import React from 'react';
import AuthTest from '../../components/AuthTest';

const TestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-6">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Authentication & Security Test
          </h1>
          <p className="text-text-muted">
            This page is used to validate NextAuth integration and security utilities
          </p>
        </div>
        
        <AuthTest />

        <div className="text-center text-xs text-text-muted mt-8">
          <p>
            This is a development test page. Remove before production deployment.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestPage;