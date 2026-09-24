# JWT Authentication

## Definition

JWT (JSON Web Token) is a token-based authentication mechanism where a server signs a JSON payload and sends it to the client as a string. The client stores the token and includes it in subsequent requests, and the server validates the signature without querying a database.

## Mental Model

**Traditional session auth**:
```
Client: "Here's username + password"
Server: "OK, verified. Here's session ID: abc123"
Server: *stores {abc123 → user_data} in database*

Client: "Here's session ID: abc123"
Server: *looks up abc123 in database*
Server: "OK, you're user X"
```

**JWT auth**:
```
Client: "Here's username + password"
Server: "OK, verified. Here's token: eyJhbGciOiJIUzI1NiI..."
Server: *token contains user data, signed with secret*

Client: "Here's token: eyJhbGciOiJIUzI1NiI..."
Server: *verifies signature using secret* (no DB lookup!)
Server: "OK, you're user X"
```

## Structure

A JWT has three parts separated by dots:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

^ Header            ^ Payload                              ^ Signature
```

### Header
```json
{
  "alg": "HS256",    // Algorithm (HMAC with SHA-256)
  "typ": "JWT"
}
```

### Payload
```json
{
  "userId": "user_123",
  "email": "user@example.com",
  "role": "admin",
  "iat": 1516239022,     // Issued at (Unix timestamp)
  "exp": 1516325422     // Expires at (Unix timestamp)
}
```

### Signature
```
HMACSHA256(
  base64(header) + "." + base64(payload),
  "secret_key"
)
```

The signature proves the token hasn't been tampered with.

## Example Flow

```typescript
// 1. Sign in: Create token
const token = jwt.sign(
  { userId: 'user_123', email: 'user@example.com' },
  'secret_key',
  { expiresIn: '24h' }
);
// Token: eyJhbGciOiJIUzI1NiI...

// 2. Store in secure cookie
res.setHeader('Set-Cookie', 
  `jwt=${token}; HttpOnly; Secure; SameSite=Strict`
);

// 3. Client sends cookie with each request (automatically)
// GET /api/users
// Cookie: jwt=eyJhbGciOiJIUzI1NiI...

// 4. Server validates token
const user = jwt.verify(token, 'secret_key');
// If signature is invalid or token expired, throws error
// If valid, returns payload: { userId, email }

console.log(user.userId); // 'user_123'
```

## Storage

**Where to store JWT?**

- **Secure HTTP-only cookie** (best): Server sets cookie, browser sends automatically, not accessible to JavaScript
- **localStorage** (risky): JavaScript can read/write, vulnerable to XSS
- **sessionStorage** (risky): Lost on page reload

**Best practice in Jarvis**:
```typescript
// Server sets HTTP-only cookie after sign-in
res.setHeader('Set-Cookie', 
  `jwt=${token}; HttpOnly; Secure; SameSite=Strict; Path=/`
);

// Browser automatically includes cookie in all requests
// Server validates in middleware
app.use(cookieMiddleware());
app.use((c, next) => {
  const token = c.req.cookie('jwt');
  if (token) {
    try {
      const user = jwt.verify(token, JWT_SECRET);
      c.set('user', user);
    } catch (e) {
      // Token invalid or expired
    }
  }
  return next();
});
```

## Advantages

- **Stateless**: No session database needed
- **Scalable**: Any server can validate any token (just need the secret)
- **Mobile-friendly**: Works with HTTP headers and cookies
- **CORS-friendly**: Can be stored as cookie or header

## Disadvantages

- **Revocation hard**: Token valid until expiration (no logout button instantly invalidates)
- **Size**: Token bigger than session ID (embedded data)
- **Secret management**: Must protect JWT secret in production

## Common Patterns

### Token Refresh
```typescript
// Short-lived JWT (15 minutes)
const accessToken = jwt.sign(payload, secret, { expiresIn: '15m' });

// Long-lived refresh token (7 days) - can be refreshed
const refreshToken = jwt.sign(payload, secret, { expiresIn: '7d' });

// Client uses accessToken for API calls
// When expired, use refreshToken to get a new accessToken
```

### Token Invalidation (Logout)
```typescript
// Delete cookie on logout
res.setHeader('Set-Cookie', 
  `jwt=; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
);

// For immediate revocation, maintain a blacklist of revoked tokens
// Check blacklist during validation
```

## Related Concepts

- [[adfs-authentication]] — Alternative auth system
- [[request-context-pattern]] — Passing user through context
- [[hono]] — Hono handles cookies and middleware
- [[jarvis-bff]] — JWT used in Jarvis for auth
- [[jarvis-permissions]] — Roles carried in the token

## Sources

- [[raw/jarvis/BFF-ARCHITECTURE.md]]
- [[raw/jarvis/apps/model-catalog/bff/src/utils/jwt.ts]]
- [[raw/jarvis/apps/model-catalog/bff/src/auth/auth.service.ts]]

JWT structure, signing algorithms and general security guidance are general
knowledge; only the Jarvis token shape and cookie handling come from the sources above.
