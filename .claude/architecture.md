# Project Architecture Rules

## Module-Based Organization

Features are organized into **modules** in `apps/web/src/modules/`.

### Module Structure
```
modules/
└── [feature-name]/
    ├── components/     # Feature components
    ├── types.ts        # Feature types
    ├── utils.ts        # Feature utilities
    ├── constants.ts    # Feature constants
    └── index.ts        # Module exports
```

### Component Placement Rules

**Module components** (`modules/[feature]/components/`)
- Components specific to ONE feature only
- Example: `LoginForm`, `SignUpForm`, `BookingCard`

**Shared components** (`components/`)
- Components used across MULTIPLE features
- Example: `Header`, `Footer`, `Layout`

**UI primitives** (`components/ui/`)
- Shadcn/Radix UI components only
- Example: `Button`, `Input`, `Dialog`

### Import Guidelines

```typescript
// Module imports
import { ProtectedRoute } from "@/modules/auth";
import { BookingForm } from "@/modules/booking";

// Shared components
import { Button } from "@/components/ui/button";

// Global utilities
import { cn } from "@/lib/utils";
```

### Existing Modules
- `modules/auth/` - Authentication
- `modules/onboarding/` - User onboarding

### Decision Tree
```
Is component used in multiple features?
├─ YES → components/ (or components/ui/ for primitives)
└─ NO → modules/[feature]/components/
```

## Rules
- ✅ Keep feature code together in modules
- ✅ Use module index.ts for exports
- ✅ Only truly shared components in components/
- ❌ Don't put feature-specific code in components/
- ❌ Don't over-comment code