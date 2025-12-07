# Invalid Session Token Handling

## The Question

**What happens if the session token cookie exists but is invalid/expired?**

## Complete Flow Breakdown

### Scenario: User has expired/invalid session token

```
1. User visits /dashboard
   ↓
2. Middleware checks: request.cookies.get("better-auth.session_token")
   ✅ Cookie exists
   ↓
3. Middleware allows through (doesn't validate, just checks existence)
   ↓
4. /dashboard page renders
   ↓
5. Component calls useSession()
   ↓
6. Better Auth validates token against database
   - Checks if token exists in session table
   - Checks if token is expired
   - Checks if token hash matches
   ↓
7. Validation fails → Returns { data: null, isPending: false }
   ↓
8. useEffect hook detects !session
   ↓
9. router.push("/login") → Redirects to login
   ↓
10. User must sign in again
```

## Code Implementation

### Dashboard Component (Updated)

```typescript
// src/app/dashboard/page.tsx

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  // CRITICAL: Redirect if session is invalid
  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  // While checking session
  if (isPending) {
    return <LoadingSpinner />;
  }

  // While redirecting to login
  if (!session) {
    return <LoadingSpinner />; // Brief flash before redirect
  }

  // Session is valid - show content
  return <ProtectedContent />;
}
```

### Reusable Pattern: ProtectedRoute Component

Created: `src/components/auth/ProtectedRoute.tsx`

```typescript
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function MyPage() {
  return (
    <ProtectedRoute>
      {/* Only renders if session is valid */}
      <div>Protected content</div>
    </ProtectedRoute>
  );
}
```

## Why This Two-Layer Approach Works

### Layer 1: Middleware (Cookie Check)
**Purpose:** Fast routing decisions
- ✅ **Pros:**
  - No database queries
  - Runs on Edge (very fast)
  - Handles 99% of cases correctly
- ❌ **Cons:**
  - Doesn't validate token validity
  - Lets invalid tokens through

### Layer 2: Component (Session Validation)
**Purpose:** Security and data access
- ✅ **Pros:**
  - Full database validation
  - Detects expired/invalid tokens
  - Gets actual user data
- ❌ **Cons:**
  - Slight delay (database query)
  - Runs on every protected page

## Security Analysis

### Is this approach secure?

**YES! Here's why:**

1. **Invalid tokens are caught at component level**
   - Even if middleware lets them through
   - Component validates and redirects

2. **No unauthorized data exposure**
   - User sees loading spinner, not protected data
   - Redirect happens before content renders

3. **Session validation is cryptographically secure**
   - Better Auth validates token hash
   - Checks expiration timestamp
   - Verifies against database

4. **Worst case scenario**
   - User with expired token sees loading spinner for <1 second
   - Gets redirected to login
   - No security breach

## User Experience

### Valid Session (Normal Flow)
```
User visits page → Middleware allows → useSession validates → Content renders
Time: ~100ms (fast)
```

### Invalid Session (Edge Case)
```
User visits page → Middleware allows → useSession fails → Shows loader → Redirects
Time: ~500ms (acceptable)
User experience: Brief loading, then login page
```

### No Session (Common Flow)
```
User visits page → Middleware redirects → Login page
Time: ~0ms (instant redirect, no component render)
```

## Common Invalid Token Scenarios

### 1. Expired Session
```
- Token created: Dec 1, 2025
- Expires at: Dec 8, 2025 (7 days)
- User visits: Dec 10, 2025
- Result: useSession() returns null → Redirect to login
```

### 2. Manually Deleted Session
```
- User signs out on another device
- Session deleted from database
- Cookie still exists on this device
- Result: useSession() returns null → Redirect to login
```

### 3. Tampered Cookie
```
- Attacker tries to modify token value
- Token hash doesn't match database
- Result: useSession() returns null → Redirect to login
```

### 4. Database Session Cleanup
```
- Admin manually clears old sessions
- Cookie still exists on user's device
- Result: useSession() returns null → Redirect to login
```

## Testing Invalid Tokens

### Test 1: Manually Expire a Session

```sql
-- In Supabase SQL editor
UPDATE public.session
SET expires_at = NOW() - INTERVAL '1 day'
WHERE user_id = 'your-user-id';
```

Then visit `/dashboard` → Should redirect to login

### Test 2: Delete Session from Database

```sql
-- Delete all sessions for a user
DELETE FROM public.session
WHERE user_id = 'your-user-id';
```

Cookie still exists → Visit `/dashboard` → Redirects to login

### Test 3: Modify Cookie Value

```javascript
// In browser console
document.cookie = "better-auth.session_token=invalid-token; path=/";
```

Visit `/dashboard` → Redirects to login

## Automatic Cookie Cleanup

Better Auth automatically cleans up invalid cookies when:

1. **signOut() is called**
   - Deletes session from database
   - Clears cookie from browser

2. **New sign in**
   - Creates new session
   - Overwrites old cookie

3. **Session validation fails**
   - Better Auth clears the invalid cookie
   - Forces fresh login

## Best Practices

### ✅ DO: Use ProtectedRoute wrapper

```typescript
export default function MyPage() {
  return (
    <ProtectedRoute>
      <MyContent />
    </ProtectedRoute>
  );
}
```

### ✅ DO: Add useEffect redirect for custom layouts

```typescript
const { data: session, isPending } = useSession();

useEffect(() => {
  if (!isPending && !session) {
    router.push("/login");
  }
}, [session, isPending, router]);
```

### ❌ DON'T: Assume session exists because cookie exists

```typescript
// BAD - No session check
export default function DashboardPage() {
  return <div>Welcome!</div>; // Might show to unauthenticated users
}
```

### ❌ DON'T: Access session data without null check

```typescript
// BAD - Will crash if session is null
const userName = session.user.name; // TypeError if session is null

// GOOD
const userName = session?.user.name ?? "Guest";
```

## Summary

**Question:** What if the session token cookie exists but is invalid?

**Answer:**
1. Middleware lets request through (only checks cookie existence)
2. Component calls `useSession()` which validates against database
3. Validation fails → Returns `null`
4. `useEffect` hook detects no session
5. Redirects user to `/login`
6. User must sign in again with valid credentials

**Result:** Secure, handles gracefully, good UX (brief loading before redirect)

This two-layer approach balances **performance** (fast middleware) with **security** (proper validation in components).
