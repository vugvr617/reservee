# Architecture & Module Structure

## Module-Based Organization

This project follows a **module-based architecture** where features are organized into self-contained modules.

### Module Structure

```
src/
├── modules/
│   ├── auth/              # Authentication module
│   │   ├── components/    # Auth-specific components
│   │   ├── types.ts       # Auth-related types
│   │   ├── utils.ts       # Auth utility functions
│   │   └── constants.ts   # Auth constants
│   │
│   ├── onboarding/        # User onboarding module
│   │   ├── components/
│   │   ├── types.ts
│   │   └── utils.ts
│   │
│   └── booking/           # Booking/reservation module
│       ├── components/
│       ├── types.ts
│       └── utils.ts
│
├── components/            # Shared/global components only
│   └── ui/               # Shadcn/Radix UI components
│
├── lib/                  # Global utilities & configurations
│   ├── auth.ts           # Auth configuration
│   └── utils.ts          # Global utilities
│
└── app/                  # Next.js App Router pages
    ├── (auth)/           # Auth route group
    ├── dashboard/
    └── ...
```

## Rules & Guidelines

### 1. Module Organization

**What belongs in a module:**
- ✅ Components specific to that feature
- ✅ Types used only in that module
- ✅ Utilities specific to that feature
- ✅ Constants specific to that module

**What does NOT belong in a module:**
- ❌ Shared UI components (Button, Input, etc.) → `components/ui/`
- ❌ Global utilities → `lib/`
- ❌ Cross-module components → `components/`

### 2. Module Structure Template

```
modules/
└── [feature-name]/
    ├── components/        # Feature-specific components
    │   ├── FeatureForm.tsx
    │   ├── FeatureCard.tsx
    │   └── FeatureList.tsx
    ├── hooks/            # Feature-specific hooks (optional)
    │   └── useFeature.ts
    ├── types.ts          # Feature types & interfaces
    ├── utils.ts          # Feature utilities
    ├── constants.ts      # Feature constants
    └── api.ts            # Feature API calls (optional)
```

### 3. Import Guidelines

**From within a module:**
```typescript
// ✅ Relative imports within same module
import { LoginForm } from './components/LoginForm';
import { AuthUser } from './types';
```

**From other modules:**
```typescript
// ✅ Import from module index or specific file
import { ProtectedRoute } from '@/modules/auth/components/ProtectedRoute';
import { BookingCard } from '@/modules/booking/components/BookingCard';
```

**Shared components:**
```typescript
// ✅ Import shared UI components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
```

**Global utilities:**
```typescript
// ✅ Import global utilities
import { cn } from '@/lib/utils';
import { auth } from '@/lib/auth';
```

### 4. Component Placement Decision Tree

```
Is this component used in multiple features?
├─ YES → components/
│   └─ Is it a UI primitive (Button, Input)?
│       ├─ YES → components/ui/
│       └─ NO → components/
│
└─ NO → Is it specific to one feature?
    └─ YES → modules/[feature]/components/
```

## Example Modules

### Auth Module
```
modules/auth/
├── components/
│   ├── LoginForm.tsx
│   ├── SignUpForm.tsx
│   ├── AuthLogo.tsx
│   └── ProtectedRoute.tsx
├── types.ts
├── utils.ts
└── constants.ts
```

**Responsibilities:**
- User authentication
- Login/signup forms
- Protected route wrapper
- Auth-related utilities

### Onboarding Module
```
modules/onboarding/
├── components/
│   ├── OnboardingWizard.tsx
│   ├── StepOne.tsx
│   └── StepTwo.tsx
├── types.ts
└── utils.ts
```

**Responsibilities:**
- New user onboarding flow
- Multi-step wizard
- Initial setup

### Booking Module
```
modules/booking/
├── components/
│   ├── BookingForm.tsx
│   ├── BookingList.tsx
│   └── BookingCard.tsx
├── types.ts
├── utils.ts
└── api.ts
```

**Responsibilities:**
- Restaurant reservations
- Booking management
- Reservation calendar

## Shared Components

Only truly **reusable across features** components go here:

```
components/
├── ui/                   # Shadcn/Radix primitives
│   ├── button.tsx
│   ├── input.tsx
│   └── ...
│
└── shared/              # Custom shared components
    ├── Header.tsx       # Used in multiple features
    └── Footer.tsx       # Global footer
```

## Lib Directory

Global configurations and utilities:

```
lib/
├── auth.ts              # Better Auth config
├── auth-client.ts       # Auth client utilities
└── utils.ts             # Global utility functions
```

## Benefits of This Structure

✅ **Clear ownership** - Each module owns its components
✅ **Easy to find** - Feature-related code grouped together
✅ **Scalable** - Add new modules without touching others
✅ **Better imports** - Clear where components come from
✅ **Isolation** - Modules are self-contained
✅ **Team-friendly** - Multiple devs can work on different modules

## Migration Guide

When moving components:

1. **Identify the feature** - What module does this belong to?
2. **Move the file** - `modules/[feature]/components/`
3. **Update imports** - Change to new path
4. **Update related files** - Types, utils in same module

Example:
```bash
# Before
src/components/auth/ProtectedRoute.tsx

# After
src/modules/auth/components/ProtectedRoute.tsx
```

## Future Modules

Potential modules as app grows:

- `modules/dashboard/` - Dashboard widgets and analytics
- `modules/settings/` - User settings and preferences
- `modules/restaurants/` - Restaurant management
- `modules/analytics/` - Analytics and reporting
- `modules/notifications/` - Notification system
