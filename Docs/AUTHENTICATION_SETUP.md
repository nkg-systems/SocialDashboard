# Authentication Setup Guide

This guide explains how to set up and configure the NextAuth.js authentication system for the Social Dashboard application.

## Overview

The application uses NextAuth.js for secure authentication with the following features:
- OAuth providers (Google, GitHub, Discord)
- Credentials-based authentication (email/password)
- JWT-based sessions
- Role-based access control (RBAC)
- Permission-based authorization
- Secure session management
- Audit logging

## Quick Setup

### 1. Environment Variables

Copy the example environment file and configure your settings:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your actual values:

```env
# Required: NextAuth Secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your-super-secret-key-here

# Required: Your application URL
NEXTAUTH_URL=http://localhost:3000

# Optional: OAuth Provider Credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 2. OAuth Provider Setup

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`

#### GitHub OAuth Setup (Optional)
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Authorization callback URL:
   - Development: `http://localhost:3000/api/auth/callback/github`
   - Production: `https://yourdomain.com/api/auth/callback/github`

### 3. Test the Setup

Start the development server:

```bash
npm run dev
```

Navigate to:
- Sign in: `http://localhost:3000/auth/signin`
- Sign out: `http://localhost:3000/auth/signout`

## Authentication Features

### Security Utilities

The application provides updated security utilities that integrate with NextAuth:

#### For React Components (using hooks):
```typescript
import { useSecurityUtils } from '../utils/security';

function MyComponent() {
  const { user, getCurrentUserId, hasPermission, verifyResourceOwnership } = useSecurityUtils();
  
  // Check if user has permission
  if (!hasPermission('write')) {
    return <div>Access denied</div>;
  }
  
  // Verify resource ownership
  const canEdit = verifyResourceOwnership(resourceUserId);
  
  return <div>Welcome, {user?.email}</div>;
}
```

#### For Non-Component Code (using parameters):
```typescript
import { hasPermissionForUser, verifyResourceOwnershipForUser } from '../utils/security';

function handleAction(user: User | null, resourceUserId: string) {
  // Check permission with user parameter
  if (!hasPermissionForUser(user, 'delete')) {
    throw new Error('Permission denied');
  }
  
  // Verify ownership with user parameter
  if (!verifyResourceOwnershipForUser(user, resourceUserId)) {
    throw new Error('Resource access denied');
  }
  
  // Proceed with action...
}
```

### Protected Routes

Use the `withAuth` HOC to protect pages:

```typescript
import { withAuth } from '../contexts/AuthContext';

const MyProtectedPage = () => {
  return <div>This page requires authentication</div>;
};

// Protect with authentication only
export default withAuth(MyProtectedPage);

// Protect with specific permissions
export default withAuth(MyProtectedPage, ['read', 'write']);

// Protect with specific role
export default withAuth(MyProtectedPage, [], 'admin');
```

### Role-Based Access Control

The system supports the following roles:
- `admin`: Full access to all features
- `user`: Standard user access
- `viewer`: Read-only access

Default permissions by role:
- **admin**: `['read', 'write', 'delete', 'admin']`
- **user**: `['read', 'write', 'delete_own']`
- **viewer**: `['read']`

### Authentication Context

Access authentication state anywhere in your app:

```typescript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    signIn, 
    signOut, 
    hasPermission, 
    isRole 
  } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please sign in</div>;

  return (
    <div>
      <p>Hello, {user.name}!</p>
      {hasPermission('admin') && <AdminPanel />}
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}
```

## Development Credentials

For development and testing, the following credentials are pre-configured:

### Admin User
- Email: `admin@socialdashboard.com`
- Password: `admin123!`
- Role: `admin`
- Permissions: `['read', 'write', 'delete', 'admin']`

### Regular User
- Email: `user@socialdashboard.com`
- Password: `user123!`
- Role: `user`
- Permissions: `['read', 'write', 'delete_own']`

**⚠️ Important: Change or remove these credentials before deploying to production!**

## Security Best Practices

1. **Environment Variables**: Never commit `.env.local` to version control
2. **Secrets**: Use strong, randomly generated secrets
3. **HTTPS**: Always use HTTPS in production
4. **Session Security**: Sessions expire after 24 hours by default
5. **Rate Limiting**: Built-in rate limiting prevents abuse
6. **Audit Logging**: All authentication events are logged
7. **Permission Checks**: Always verify permissions before sensitive operations

## Troubleshooting

### Common Issues

1. **"Missing environment variable" warnings**
   - Ensure all required variables are set in `.env.local`
   - Restart the development server after changes

2. **OAuth provider errors**
   - Check that redirect URIs are correctly configured
   - Verify client IDs and secrets are correct

3. **Session not persisting**
   - Check that `NEXTAUTH_SECRET` is set
   - Ensure cookies are enabled in browser

4. **Permission denied errors**
   - Verify user has correct role and permissions
   - Check that authentication context is properly wrapped

### Debugging

Enable debug mode in development by setting in `.env.local`:
```env
NODE_ENV=development
```

This will enable detailed NextAuth logging in the console.

## Production Deployment

Before deploying to production:

1. Set `NODE_ENV=production` in your environment
2. Use a strong `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
3. Update `NEXTAUTH_URL` to your production domain
4. Configure OAuth providers with production redirect URIs
5. Remove or update development credentials
6. Enable HTTPS for all traffic
7. Set up proper database for user storage
8. Configure audit logging endpoint

## Migration from Mock Authentication

The security utilities have been updated to support both new NextAuth integration and legacy mock authentication:

- **New code**: Use `useSecurityUtils()` hook or parameter-based functions
- **Legacy code**: Will show deprecation warnings but continue to work
- **Migration**: Gradually update components to use new authentication methods

This ensures backward compatibility while encouraging migration to the secure NextAuth system.