# API Integration Layer

This directory contains the core API integration layer for the SM3D frontend application.

## Security Features

The API client includes several security features:

- **Rate Limiting**: Prevents API abuse with client-side rate limiting (60 requests per minute by default)
- **Error Sanitization**: Removes sensitive data from error messages before displaying to users
- **Automatic Authentication**: Handles JWT token refresh automatically
- **Request Validation**: Validates API endpoints to prevent malicious requests
- **CORS Protection**: Uses `credentials: 'include'` for secure cookie handling

## Components

### `apiClient.ts`

The core API client that handles all HTTP requests with the backend.

**Features:**
- Automatic JWT token management
- Request/response interceptors
- Comprehensive error handling
- Rate limiting protection
- TypeScript support

**Usage:**
```typescript
import { apiClient } from '@/lib/apiClient';

// GET request
const data = await apiClient.get<User>('/auth/me');

// POST request with data
const result = await apiClient.post('/posts', { content: 'Hello World' });

// Error handling
try {
  await apiClient.get('/protected-resource');
} catch (error) {
  if (error instanceof ApiError) {
    console.log(`Error ${error.status}: ${error.message}`);
  }
}
```

## Security Best Practices

### 1. Error Handling
- All error messages are sanitized to prevent information leakage
- Sensitive patterns (tokens, keys, secrets) are automatically redacted
- Stack traces are only shown in development mode

### 2. Rate Limiting
- Client-side rate limiting prevents API abuse
- Configurable limits (default: 60 requests per minute)
- Per-endpoint tracking for granular control

### 3. Authentication
- HTTP-only cookies for secure token storage
- Automatic token refresh on expiry
- Graceful handling of authentication failures

### 4. Request Validation
- API endpoint validation prevents malicious requests
- UUID validation for resource IDs
- Platform name validation for social media integrations

## Error Types

The API client defines a custom `ApiError` class that includes:
- HTTP status code
- Sanitized error message
- Optional error details (for debugging)

## Development vs Production

The API client behaves differently based on the environment:

**Development:**
- Detailed error logging
- Stack traces in error boundaries
- HTTP allowed for localhost

**Production:**
- Minimal error logging
- No sensitive data in logs
- HTTPS-only connections

## Configuration

The API client can be configured via environment variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000  # Backend API URL
```

## Testing

When writing tests for components that use the API client:

1. Mock the entire apiClient module
2. Use the provided error types for consistent error handling
3. Test both success and error scenarios
4. Verify rate limiting behavior

Example:
```typescript
// __mocks__/apiClient.ts
export const apiClient = {
  get: jest.fn(),
  post: jest.fn(),
  // ... other methods
};

// In your test
import { apiClient } from '@/lib/apiClient';

it('handles API errors gracefully', async () => {
  (apiClient.get as jest.Mock).mockRejectedValue(
    new ApiError('Not found', 404)
  );
  
  // Test error handling
});
```

## Performance Considerations

- The API client includes rate limiting to prevent overwhelming the backend
- Requests are optimized with proper headers and caching strategies
- Error states include loading indicators for better UX

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never log sensitive data** - All error messages are automatically sanitized
2. **Use HTTPS in production** - The client enforces secure connections
3. **Validate all inputs** - Use the provided validation utilities
4. **Handle rate limits** - Implement proper backoff strategies
5. **Monitor for abuse** - Log suspicious activity patterns

## Contributing

When adding new API integration:

1. Use the existing `apiClient` instance
2. Add appropriate TypeScript types
3. Include comprehensive error handling
4. Add rate limiting for high-frequency endpoints
5. Write tests for both success and error cases
6. Document security considerations