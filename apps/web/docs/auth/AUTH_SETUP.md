# Better Auth Setup

Better Auth has been successfully configured for the Reservee application.

## What's Included

### Database Tables (Public Schema)
- `user` - Stores user account information
- `session` - Manages user sessions
- `account` - Stores authentication credentials (passwords, OAuth tokens)
- `verification` - Handles email verification tokens

### Files Created
- `src/lib/auth.ts` - Server-side Better Auth configuration
- `src/lib/auth-client.ts` - Client-side auth utilities and hooks
- `src/app/api/auth/[...all]/route.ts` - API route handler for auth endpoints

### Updated Components
- `src/modules/auth/components/LoginForm.tsx` - Integrated with Better Auth sign in
- `src/modules/auth/components/SignUpForm.tsx` - Integrated with Better Auth sign up

## Environment Variables

Required environment variables in `apps/web/.env`:

```env
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=your-secret-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Usage

### Sign Up
Users can create an account at `/sign-up`:
- Name
- Email
- Password (min 8 characters)

After successful signup, users are redirected to `/onboarding`.

### Sign In
Users can log in at `/login`:
- Email
- Password
- Remember me option

After successful login, users are redirected to `/dashboard`.

### Using Auth in Components

```typescript
import { useSession, signOut } from "@/lib/auth-client";

function MyComponent() {
  const { data: session, isPending } = useSession();

  if (isPending) return <div>Loading...</div>;

  if (!session) return <div>Not logged in</div>;

  return (
    <div>
      <p>Welcome, {session.user.name}!</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}
```

## API Endpoints

Better Auth automatically provides these endpoints:

- `POST /api/auth/sign-up/email` - Create new account
- `POST /api/auth/sign-in/email` - Sign in with email/password
- `POST /api/auth/sign-out` - Sign out current session
- `GET /api/auth/get-session` - Get current session
- And more...

## Security Features

- ✅ Password hashing (handled by Better Auth)
- ✅ Session management with secure cookies
- ✅ Row Level Security (RLS) policies enabled
- ✅ CSRF protection
- ✅ Secure cookie settings in production

## Next Steps

1. **Email Verification**: Set `requireEmailVerification: true` in `src/lib/auth.ts` and configure email provider
2. **OAuth Providers**: Add social login (Google, GitHub, etc.)
3. **Protected Routes**: Create middleware to protect authenticated routes
4. **Password Reset**: Implement forgot password functionality
5. **Two-Factor Authentication**: Add 2FA support
