/**
 * Authentication Context
 * Provides secure authentication state and user management
 */

'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useSession, SessionProvider, signIn, signOut } from 'next-auth/react';
import { Session } from 'next-auth';

// Extended session interface
interface ExtendedSession extends Session {
  user: {
    id: string;
    email: string;
    name?: string;
    image?: string;
    role: string;
    permissions: string[];
  };
}

// Auth context interface
interface AuthContextType {
  session: ExtendedSession | null;
  user: ExtendedSession['user'] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: typeof signIn;
  signOut: typeof signOut;
  hasPermission: (permission: string) => boolean;
  isRole: (role: string) => boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider component
const AuthProviderInner: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const isAuthenticated = !!session;

  // Type-safe session casting
  const extendedSession = session as ExtendedSession | null;
  const user = extendedSession?.user || null;

  // Security: Check if user has specific permission
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Admin role has all permissions
    if (user.role === 'admin') return true;
    
    // Check specific permission
    return user.permissions?.includes(permission) || false;
  };

  // Security: Check if user has specific role
  const isRole = (role: string): boolean => {
    if (!user) return false;
    return user.role === role;
  };

  const value: AuthContextType = {
    session: extendedSession,
    user,
    isAuthenticated,
    isLoading,
    signIn,
    signOut,
    hasPermission,
    isRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Main auth provider with session provider wrapper
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <SessionProvider>
      <AuthProviderInner>
        {children}
      </AuthProviderInner>
    </SessionProvider>
  );
};

// HOC for protecting routes
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermissions: string[] = [],
  requiredRole?: string
) {
  const WithAuthComponent: React.FC<P> = (props) => {
    const { isAuthenticated, isLoading, hasPermission, isRole } = useAuth();

    // Show loading spinner while checking authentication
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      signIn();
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-text-muted">Redirecting to login...</p>
          </div>
        </div>
      );
    }

    // Check role requirements
    if (requiredRole && !isRole(requiredRole)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-text-muted">You don't have the required role to access this page.</p>
          </div>
        </div>
      );
    }

    // Check permission requirements
    const hasAllPermissions = requiredPermissions.every(permission => hasPermission(permission));
    if (requiredPermissions.length > 0 && !hasAllPermissions) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-text-muted">You don't have the required permissions to access this page.</p>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };

  WithAuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`;
  return WithAuthComponent;
}

export default AuthProvider;