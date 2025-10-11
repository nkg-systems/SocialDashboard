/**
 * NextAuth.js Route Handler
 * Secure authentication configuration with multiple providers
 */

import NextAuth, { AuthOptions, User, Session } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';

// Security: Environment variables validation
const requiredEnvVars = {
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
};

// Validate required environment variables
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    console.warn(`Missing environment variable: ${key}`);
  }
});

// Extended user interface for type safety
interface ExtendedUser extends User {
  id: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  permissions: string[];
  createdAt?: Date;
  lastLoginAt?: Date;
}

// JWT interface extension
interface ExtendedJWT extends JWT {
  role?: string;
  permissions?: string[];
  userId?: string;
}

// Session interface extension  
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

const authOptions: AuthOptions = {
  // Security: Configure session strategy
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // 1 hour
  },

  // Security: JWT configuration
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },

  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      }
    }),

    // Credentials Provider (Email/Password)
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { 
          label: 'Email', 
          type: 'email',
          placeholder: 'your.email@example.com'
        },
        password: { 
          label: 'Password', 
          type: 'password',
          placeholder: 'Your secure password'
        }
      },
      async authorize(credentials): Promise<ExtendedUser | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Security: Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(credentials.email)) {
            return null;
          }

          // TODO: Replace with actual database lookup
          // SECURITY: Using pre-hashed passwords for development - NEVER store plain text passwords
          // These are hashed versions of 'admin123!' and 'user123!' for development only
          const mockUsers = [
            {
              id: 'user_dev_001',
              email: 'admin@socialdashboard.com',
              // Pre-hashed 'admin123!' - bcrypt hash with 12 rounds
              passwordHash: '$2b$12$NvZbXkFU.IJ7POsBU1E.meUu1/O5jFb/Lgwi/CLzF3avp5V9gWhFe',
              name: 'Admin User',
              role: 'admin' as const,
              permissions: ['read', 'write', 'delete', 'admin'],
              createdAt: new Date(),
            },
            {
              id: 'user_dev_002', 
              email: 'user@socialdashboard.com',
              // Pre-hashed 'user123!' - bcrypt hash with 12 rounds
              passwordHash: '$2b$12$t69x7dNHmEKEyr8lW8FsjOM7vsID0FJ42f/4ItfyjmQ3/0nVXd45O',
              name: 'Regular User',
              role: 'user' as const,
              permissions: ['read', 'write', 'delete_own'],
              createdAt: new Date(),
            }
          ];

          const user = mockUsers.find(u => u.email === credentials.email);
          if (!user) {
            return null;
          }

          // Security: Verify password with bcrypt
          const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!isPasswordValid) {
            return null;
          }

          // Return user data (without password hash)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            permissions: user.permissions,
            createdAt: user.createdAt,
            lastLoginAt: new Date(),
          };

        } catch (error) {
          // SECURITY: Log error without exposing sensitive details
          console.error('Authentication failed for user');
          return null;
        }
      }
    })
  ],

  callbacks: {
    // Security: JWT callback to add user data
    async jwt({ token, user, account }): Promise<ExtendedJWT> {
      if (user && account) {
        const extendedUser = user as ExtendedUser;
        
        token.userId = extendedUser.id;
        token.role = extendedUser.role;
        token.permissions = extendedUser.permissions;
        
        // For OAuth providers, set default role and permissions
        if (account.provider === 'google') {
          token.role = 'user';
          token.permissions = ['read', 'write', 'delete_own'];
        }
      }
      
      return token;
    },

    // Security: Session callback to expose user data to client
    async session({ session, token }): Promise<ExtendedSession> {
      const extendedToken = token as ExtendedJWT;
      
      return {
        ...session,
        user: {
          id: extendedToken.userId || extendedToken.sub || '',
          email: session.user?.email || '',
          name: session.user?.name || '',
          image: session.user?.image || '',
          role: extendedToken.role || 'user',
          permissions: extendedToken.permissions || ['read'],
        }
      };
    },

    // Security: Redirect callback for custom login flows
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },

  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },

  // Security: Event handlers for logging
  events: {
    async signIn({ user, account, profile }) {
      // SECURITY: Log without exposing email address
      console.log(`User signed in: ${user.id} via ${account?.provider || 'credentials'}`);
      
      // TODO: Log to audit system
      // auditLog.log('SIGN_IN', user.id, true, { 
      //   provider: account?.provider,
      //   ip: 'client_ip_here' 
      // });
    },
    async signOut({ token }) {
      const extendedToken = token as ExtendedJWT;
      console.log(`User signed out: ${extendedToken.userId}`);
      
      // TODO: Log to audit system
      // auditLog.log('SIGN_OUT', extendedToken.userId, true);
    }
  },

  // Security: Enable debug in development only
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };