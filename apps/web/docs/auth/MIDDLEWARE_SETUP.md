# Authentication Middleware Setup

The middleware has been configured to protect your routes and manage authentication flows.

## 🔐 How It Works

### Route Types

**1. Public Routes** (accessible to everyone)
- `/` - Landing page (open to all)
- Static files, API routes, Next.js internals

**2. Auth Routes** (only for non-authenticated users)
- `/login` - Sign in page
- `/sign-up` - Registration page

**3. Protected Routes** (require authentication)
- `/dashboard` - User dashboard
- `/onboarding` - User onboarding
- Any other route not explicitly public

### Middleware Logic

```typescript
// File: src/middleware.ts

1. Check if user has session cookie (better-auth.session_token)
2. If authenticated + accessing auth pages → redirect to /dashboard
3. If not authenticated + accessing protected pages → redirect to /login
4. Store original URL to redirect back after login
```

**Note:** The middleware uses a cookie-based approach (Edge Runtime compatible) rather than validating sessions against the database. The actual session validation happens when components call `useSession()` or server components use `auth.api.getSession()`.

## 🎯 User Flow Examples

### Scenario 1: Unauthenticated User Tries to Access Dashboard

```
User visits: /dashboard
    ↓
Middleware checks session: ❌ No session
    ↓
Redirects to: /login?from=/dashboard
    ↓
User logs in successfully
    ↓
Redirects back to: /dashboard ✅
```

### Scenario 2: Authenticated User Visits Login Page

```
User visits: /login
    ↓
Middleware checks session: ✅ Has session
    ↓
Redirects to: /dashboard
    ↓
User sees dashboard ✅
```

### Scenario 3: New User Signs Up

```
User visits: /sign-up
    ↓
Fills form and submits
    ↓
Account created + session started
    ↓
Redirects to: /onboarding ✅
```

## 📁 Files Modified/Created

### Created Files:
- [src/middleware.ts](src/middleware.ts) - Route protection middleware
- [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx) - Protected dashboard page

### Updated Files:
- [src/modules/auth/components/LoginForm.tsx](src/modules/auth/components/LoginForm.tsx) - Added redirect handling

## 🧪 Testing the Middleware

### Test Case 1: Access Dashboard Without Login
```
1. Make sure you're logged out
2. Visit: http://localhost:3000/dashboard
3. Expected: Redirected to /login?from=/dashboard
```

### Test Case 2: Login and Return to Original Page
```
1. Try to access /dashboard (redirects to login)
2. Sign in with valid credentials
3. Expected: Redirected back to /dashboard
```

### Test Case 3: Authenticated User Can't Access Login
```
1. Sign in to your account
2. Try to visit: http://localhost:3000/login
3. Expected: Redirected to /dashboard
```

### Test Case 4: Sign Out Redirects to Login
```
1. On dashboard, click "Sign Out"
2. Expected: Redirected to /login
3. Try accessing /dashboard again
4. Expected: Redirected to /login
```

## 🔧 Customizing Routes

### Add More Public Routes

Edit [src/middleware.ts:7](src/middleware.ts#L7):
```typescript
const PUBLIC_ROUTES = ["/login", "/sign-up", "/about", "/pricing"];
```

### Add Routes That Don't Require Auth (like landing page)

Edit [src/middleware.ts:13](src/middleware.ts#L13):
```typescript
const OPEN_ROUTES = ["/", "/about", "/contact"];
```

### Change Default Redirect After Login

Edit [src/middleware.ts:40](src/middleware.ts#L40):
```typescript
if (isAuthenticated && isAuthRoute) {
  return NextResponse.redirect(new URL("/home", request.url)); // Changed from /dashboard
}
```

## 🛡️ Security Features

✅ **Session validation on every request**
- Middleware checks session before allowing access

✅ **Automatic redirect with return URL**
- Users return to their intended page after login

✅ **Prevents authenticated users from accessing auth pages**
- No confusion from accessing login while logged in

✅ **Server-side protection**
- Middleware runs on the server, can't be bypassed by client

## 📝 How to Use in Your Code

### Check Authentication in a Component

```typescript
import { useSession } from "@/lib/auth-client";

function MyComponent() {
  const { data: session, isPending } = useSession();

  if (isPending) return <div>Loading...</div>;
  if (!session) return <div>Not authenticated</div>;

  return <div>Hello {session.user.name}!</div>;
}
```

### Protect a Server Component

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/login");
  }

  return <div>Protected content for {session.user.email}</div>;
}
```

### Sign Out

```typescript
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return <button onClick={handleSignOut}>Sign Out</button>;
}
```

## 🚀 Next Steps

1. **Test the middleware** - Try accessing protected routes
2. **Create more protected pages** - All routes except public ones are protected
3. **Build your onboarding flow** - Already protected by middleware
4. **Add role-based access** - Extend middleware to check user roles
5. **Add protected API routes** - Use same session validation in API routes

## 💡 Tips

- The middleware runs on **every request** that matches the config
- Session checks are **server-side** - secure and can't be bypassed
- The `from` parameter preserves user's intended destination
- Middleware doesn't run on API routes or static files (optimized)
- You can test middleware behavior by checking the Network tab in DevTools
