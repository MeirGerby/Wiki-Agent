# ADFS Authentication

## Definition

ADFS (Active Directory Federated Services) is an enterprise identity provider that authenticates users against Active Directory and issues tokens (SAML, OAuth, or OIDC). Applications integrate with ADFS to delegate user authentication and get user information from the enterprise directory.

## Mental Model

Think of ADFS as a company's "authentication gatekeep":

**Without ADFS**:
- Every app has its own user database
- Users have different passwords in each app
- Security team can't manage access centrally

**With ADFS**:
```
User → "I want to use Jarvis"
       ↓
App: "I don't manage users. Ask ADFS"
       ↓
ADFS: "I recognize you from Active Directory. Here's a token"
       ↓
App: "OK, I trust ADFS. You're in."
```

## ADFS Flow in Jarvis

```
1. User visits app (not authenticated)
   ↓
2. Frontend redirects to: /api/adfs?redirectUrl=/dashboard
   ↓
3. BFF redirects to ADFS: https://adfs.company.com/oauth/authorize?...
   ↓
4. ADFS shows login form (username/password + MFA)
   ↓
5. User enters credentials
   ↓
6. ADFS redirects back: /api/adfs?code=xxx&state=yyy
   ↓
7. BFF exchanges code for token (server-to-server, not visible to user)
   POST https://adfs.company.com/oauth/token with { code, clientId, clientSecret }
   ↓
8. ADFS returns: { accessToken, refreshToken, userInfo }
   ↓
9. BFF extracts user info: { userId, email, fullName, hierarchy }
   ↓
10. BFF creates/updates user in database
   ↓
11. BFF issues JWT [[jwt-authentication]] (stored in HTTP-only cookie)
   ↓
12. BFF redirects to frontend: /dashboard?success=true
   ↓
13. Frontend sees cookie, frontend can now make authenticated requests
```

## Key Components

### ADFS Configuration
```typescript
// adfs endpoint in BFF
const ADFS_CONFIG = {
  authority: 'https://adfs.company.com',
  clientId: 'my-app-client-id',
  clientSecret: 'my-app-secret-key', // Never expose client-side
  redirectUri: 'https://my-app.com/api/adfs/callback',
  tokenEndpoint: 'https://adfs.company.com/oauth/token',
  authorizationEndpoint: 'https://adfs.company.com/oauth/authorize',
};
```

### Authorization Code Flow
```typescript
// Step 1: Redirect user to ADFS
app.get('/api/adfs', (c) => {
  const state = generateRandomString();
  const params = new URLSearchParams({
    client_id: ADFS_CONFIG.clientId,
    response_type: 'code',
    redirect_uri: ADFS_CONFIG.redirectUri,
    state: state, // Prevent CSRF
  });
  
  c.cookie('adfs_state', state); // Store state to verify later
  return c.redirect(
    `${ADFS_CONFIG.authorizationEndpoint}?${params}`
  );
});

// Step 2: Handle ADFS callback
app.post('/api/adfs/callback', async (c) => {
  const { code, state } = c.req.query();
  
  // Verify state to prevent CSRF
  if (state !== c.req.cookie('adfs_state')) {
    throw new Error('Invalid state parameter');
  }
  
  // Exchange code for token (server-to-server)
  const tokenResponse = await fetch(ADFS_CONFIG.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: ADFS_CONFIG.clientId,
      client_secret: ADFS_CONFIG.clientSecret, // Only on server!
      redirect_uri: ADFS_CONFIG.redirectUri,
    }),
  });
  
  const { access_token, id_token } = await tokenResponse.json();
  
  // Decode JWT to get user info
  const user = jwt.decode(id_token);
  // { sub, email, name, upn, ... }
  
  // Create/update user in database
  await usersService.upsertUser({
    userId: user.sub,
    email: user.email,
    fullName: user.name,
    hierarchy: user.hierarchy, // From ADFS
  });
  
  // Issue our own JWT
  const appJwt = jwt.sign(
    { userId: user.sub, email: user.email },
    JWT_SECRET
  );
  
  // Store in HTTP-only cookie
  c.header('Set-Cookie', 
    `jwt=${appJwt}; HttpOnly; Secure; SameSite=Strict`
  );
  
  // Redirect to app
  return c.redirect('/dashboard?auth=success');
});
```

### User Creation/Update
```typescript
// ADFS gives us user info, we store it locally
async function upsertUser(adfsUser) {
  return db.users.upsert({
    where: { userId: adfsUser.sub },
    create: {
      userId: adfsUser.sub,
      email: adfsUser.email,
      fullName: adfsUser.name,
      hierarchy: adfsUser.hierarchy, // For permission checks
      createdAt: now(),
    },
    update: {
      email: adfsUser.email,
      fullName: adfsUser.name,
      hierarchy: adfsUser.hierarchy,
      lastLoginAt: now(),
    },
  });
}
```

## Enterprise Features

### Hierarchy & Permissions
ADFS includes organizational hierarchy (department, team, manager), which can be used for permissions:
```typescript
// User has hierarchy: ["company", "division", "department"]
if (user.hierarchy.includes('model-catalog-admins')) {
  // Allow admin operations
}
```

### MFA (Multi-Factor Authentication)
ADFS can enforce MFA; the app doesn't need to handle it.

### Single Logout
```typescript
// Log user out from ADFS
const logoutUrl = `${ADFS_CONFIG.authority}/oauth/logout?id_token_hint=${idToken}`;
return c.redirect(logoutUrl);
```

## Configuration in Jarvis

Environment variables:
```
ADFS_AUTHORITY=https://adfs.company.com
ADFS_CLIENT_ID=my-app-id
ADFS_CLIENT_SECRET=***secret***
ADFS_REDIRECT_URI=https://my-app.com/api/adfs/callback
DISABLE_ADFS_AUTH=false (can stub for local dev)
MAX_ADFS_LOGIN_ATTEMPTS=5
```

## Frontend Integration

```typescript
// In React
const login = () => {
  // Redirect to BFF ADFS endpoint
  window.location.href = '/api/adfs';
};

const logout = async () => {
  // Clear cookie
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/';
};
```

## Security Considerations

- **Client secret**: Never expose in frontend code (only on server)
- **State parameter**: Prevent CSRF attacks
- **HTTPS only**: ADFS redirect must be over HTTPS
- **Secure cookies**: Use HttpOnly + Secure flags
- **Token validation**: Always verify token signature

## Related Concepts

- [[jwt-authentication]] — App issues JWT after ADFS verifies user
- [[request-context-pattern]] — ADFS user flows through context
- [[jarvis-bff]] — ADFS configuration in Jarvis BFF
- [[jarvis-permissions]] — Roles derived from ADFS hierarchy

## Sources

- [[raw/jarvis/BFF-ARCHITECTURE.md]]
- [[raw/jarvis/apps/model-catalog/bff/src/main.ts]]
- [[raw/jarvis/apps/model-catalog/web/src/utils/adfs.ts]]

ADFS protocol details beyond the `/api/adfs` endpoint and `postMessage` handoff
used in Jarvis are general knowledge, not drawn from these sources.
