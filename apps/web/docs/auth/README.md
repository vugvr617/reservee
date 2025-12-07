# Authentication Documentation

Better Auth implementation for Reservee application.

## 📚 Documentation Index

### Getting Started
- **[AUTH_SETUP.md](./AUTH_SETUP.md)** - Initial setup guide, environment variables, and basic usage

### Implementation Details
- **[MIDDLEWARE_SETUP.md](./MIDDLEWARE_SETUP.md)** - Route protection middleware configuration and testing
- **[EDGE_RUNTIME_FIX.md](./EDGE_RUNTIME_FIX.md)** - Cookie-based authentication approach for Edge Runtime compatibility
- **[INVALID_TOKEN_HANDLING.md](./INVALID_TOKEN_HANDLING.md)** - How invalid/expired sessions are handled

## 🚀 Quick Start

1. **Sign up**: Visit `/sign-up` to create account
2. **Sign in**: Visit `/login` to authenticate
3. **Protected routes**: All routes except `/login`, `/sign-up`, and `/` require authentication

## 🔑 Key Concepts

### Two-Layer Authentication
1. **Middleware** - Fast cookie check for routing
2. **Components** - Full session validation for data access

### Session Management
- Sessions stored in `public.session` table
- 7-day expiration with auto-extension
- HTTP-only cookies for security

## 📁 Project Structure

```
apps/web/
├── src/
│   ├── lib/
│   │   ├── auth.ts              # Server-side auth config
│   │   └── auth-client.ts       # Client-side auth utilities
│   ├── middleware.ts            # Route protection
│   ├── app/
│   │   ├── api/auth/[...all]/   # Auth API endpoints
│   │   ├── (auth)/              # Auth pages (login, sign-up)
│   │   └── dashboard/           # Protected page example
│   └── components/
│       └── auth/
│           └── ProtectedRoute.tsx  # Reusable auth wrapper
└── docs/
    └── auth/                    # This directory
```

## 🔐 Database Tables

Created in `public` schema:
- `user` - User accounts
- `session` - Active sessions
- `account` - Credentials (passwords, OAuth)
- `verification` - Email verification tokens

## ⚙️ Environment Variables

Required in `.env`:
```bash
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=your-secret-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🧪 Testing

```bash
# Start dev server
pnpm dev

# Test flows:
1. Visit /dashboard → Redirects to /login
2. Sign up → Creates account → Redirects to /onboarding
3. Sign in → Redirects to /dashboard
4. Click "Sign Out" → Clears session → Redirects to /login
```

## 📖 Learn More

- [Better Auth Docs](https://better-auth.com)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
