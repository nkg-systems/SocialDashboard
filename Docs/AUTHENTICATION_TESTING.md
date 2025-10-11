# Authentication Testing Guide

This guide provides step-by-step instructions for testing the NextAuth integration and validating all authentication features.

## 🚀 Quick Start

### Prerequisites
- Development server is running (`npm run dev`)
- Environment variables are configured (`.env.local` exists)
- Browser with JavaScript enabled

### Test URLs
- **Test Page**: http://localhost:3000/test
- **Sign In**: http://localhost:3000/auth/signin
- **Sign Out**: http://localhost:3000/auth/signout
- **Dashboard**: http://localhost:3000/ (main app)

## 📋 Test Plan

### ✅ Phase 1: Basic Authentication Flow

#### Test 1.1: Sign In Page Access
1. Navigate to: `http://localhost:3000/auth/signin`
2. **Expected**: Clean sign-in page with provider buttons
3. **Verify**: 
   - Page loads without errors
   - Provider buttons are visible (currently credentials only)
   - No error messages displayed
   - Professional styling and layout

#### Test 1.2: Credentials Authentication
1. On the sign-in page, look for credentials form
2. **Test Admin Account**:
   - Email: `admin@socialdashboard.com`
   - Password: `admin123!`
3. Click sign in
4. **Expected**: Redirect to callback URL or dashboard
5. **Verify**: No errors, successful authentication

#### Test 1.3: Invalid Credentials
1. Try signing in with wrong credentials:
   - Email: `test@invalid.com`
   - Password: `wrongpassword`
2. **Expected**: Error message displayed
3. **Verify**: User remains on sign-in page with clear error

### ✅ Phase 2: Session Management

#### Test 2.1: Authentication Test Component
1. Navigate to: `http://localhost:3000/test`
2. **Expected**: Authentication test interface
3. **Verify**:
   - Authentication status displayed
   - Sign in button if not authenticated
   - User information if authenticated

#### Test 2.2: User Information Display
1. Sign in first (if not already)
2. On test page, verify user information shows:
   - User ID
   - Email address
   - Name (if provided)
   - Role (admin/user)
   - Permissions list
3. **Expected**: All fields populated correctly

#### Test 2.3: Permission Testing
1. On test page, check permission indicators:
   - Can Read: ✓ (should be Yes for all users)
   - Can Write: ✓ (should be Yes for admin/user)
   - Can Delete Own: ✓ (should be Yes for admin/user)
   - Can Delete: ✓ (should be Yes for admin only)
   - Is Admin: ✓ (should be Yes for admin only)

### ✅ Phase 3: Security Utilities Validation

#### Test 3.1: Security Utils Testing
1. While signed in, click "Test Security Utils" button
2. Open browser console (F12 → Console tab)
3. **Expected Console Output**:
   ```
   Current User: {id: "user_dev_001", email: "admin@socialdashboard.com", ...}
   User ID: user_dev_001
   Generated Asset ID: test_[timestamp]_[random]_[userpart]
   Has write permission: true
   Has admin permission: true/false (depending on user)
   Has delete permission: true/false (depending on user)
   Owns resource (self): true
   Owns resource (other): false
   AUDIT: {timestamp: "...", userId: "...", action: "AUTH_TEST", ...}
   ```

#### Test 3.2: Role Comparison
1. Test with both admin and user accounts:
   - **Admin** (`admin@socialdashboard.com` / `admin123!`)
   - **User** (`user@socialdashboard.com` / `user123!`)
2. Compare permissions between roles
3. **Expected Differences**:
   - Admin should have all permissions
   - User should NOT have 'admin' or 'delete' permissions

### ✅ Phase 4: Sign Out Flow

#### Test 4.1: Sign Out Process
1. While signed in, navigate to: `http://localhost:3000/auth/signout`
2. **Expected**: Sign out confirmation page
3. Click "Yes, sign me out"
4. **Expected**: Redirect to sign-in page
5. **Verify**: Session is cleared, no longer authenticated

#### Test 4.2: Session Persistence Check
1. Sign in to the application
2. Close browser tab (not entire browser)
3. Reopen: `http://localhost:3000/test`
4. **Expected**: Should still be signed in (session persisted)
5. Wait for session timeout (24 hours) or clear cookies to test expiry

### ✅ Phase 5: Error Handling

#### Test 5.1: Error Page Access
1. Navigate to: `http://localhost:3000/auth/error?error=AccessDenied`
2. **Expected**: Error page with "Access Denied" message
3. Try other error codes:
   - `CredentialsSignin`
   - `OAuthAccountNotLinked`
   - `Configuration`

#### Test 5.2: Network Error Simulation
1. Disconnect internet/network
2. Try to sign in
3. **Expected**: Appropriate error handling (may vary)
4. Reconnect and verify recovery

### ✅ Phase 6: Navigation and Integration

#### Test 6.1: Protected Routes (Future)
1. Try accessing protected areas without authentication
2. **Expected**: Redirect to sign-in or access denied
3. After signing in, access should be granted

#### Test 6.2: Main Application Integration
1. Navigate to: `http://localhost:3000/`
2. **Expected**: Main dashboard loads with authentication context
3. **Verify**: No console errors related to authentication

## 🔍 Troubleshooting

### Common Issues

#### Issue: "Module not found" errors
- **Solution**: Ensure all UI components are created and exported properly
- Check `src/components/ui/index.ts` exports

#### Issue: Build failures
- **Solution**: Check for TypeScript errors, especially in generic functions
- Verify all imports are correct

#### Issue: Authentication not working
- **Solution**: 
  - Check `.env.local` has `NEXTAUTH_SECRET` set
  - Verify NextAuth API route is accessible at `/api/auth/[...nextauth]`
  - Check browser console for errors

#### Issue: Session not persisting
- **Solution**:
  - Check browser cookies are enabled
  - Verify `NEXTAUTH_URL` matches your localhost URL
  - Check for JavaScript errors

#### Issue: Permissions not working correctly
- **Solution**:
  - Verify user roles are correctly assigned in NextAuth config
  - Check JWT and session callbacks are working
  - Test with both admin and user accounts

## 📊 Test Checklist

Use this checklist to track your testing progress:

### Basic Functionality
- [ ] Sign-in page loads correctly
- [ ] Admin credentials work (`admin@socialdashboard.com` / `admin123!`)
- [ ] User credentials work (`user@socialdashboard.com` / `user123!`)
- [ ] Invalid credentials show error
- [ ] Sign-out process works
- [ ] Error page displays correctly

### Security Features
- [ ] User information displays correctly
- [ ] Role-based permissions work (admin vs user)
- [ ] Security utilities function properly
- [ ] Asset ID generation works
- [ ] Audit logging functions
- [ ] Resource ownership validation works

### Integration
- [ ] Test page functions completely
- [ ] Main dashboard loads with authentication
- [ ] No console errors
- [ ] Session persists across page reloads
- [ ] AuthContext provides correct data

## 🎯 Success Criteria

**Authentication is working correctly when:**

1. ✅ Users can sign in with valid credentials
2. ✅ Invalid credentials are rejected with clear errors
3. ✅ User information is displayed correctly
4. ✅ Role-based permissions function as expected
5. ✅ Security utilities integrate properly with NextAuth
6. ✅ Sessions persist appropriately
7. ✅ Sign-out process clears sessions
8. ✅ Error handling works for various scenarios
9. ✅ No critical console errors during normal operation
10. ✅ AuthContext provides accurate authentication state

## 📝 Next Steps

After completing all tests successfully:

1. **Document Results**: Note any issues or unexpected behavior
2. **Performance Check**: Verify authentication doesn't slow down the app
3. **Security Review**: Ensure no sensitive data is exposed in browser
4. **Update Components**: Begin migrating existing components to use new auth
5. **Production Prep**: Plan OAuth provider setup for production

---

**Happy Testing! 🧪**

Remember: This is a development environment with mock users. In production, you'll need real OAuth providers and a proper user database.