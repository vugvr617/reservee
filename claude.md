# Claude Development Guidelines

## Color Palette

All colors are defined as CSS variables in `globals.css`. Use the corresponding Tailwind semantic classes (e.g., `bg-primary`, `text-foreground`) when possible. For brand green accents, use Tailwind's `green-*` palette.

### Primary Theme Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--background` | `#f9fafb` | Page background (neutral white-gray) |
| `--foreground` | `#374151` | Default text color |
| `--primary` | `#22c55e` | Brand green — buttons, active states, CTAs |
| `--primary-foreground` | `#ffffff` | Text on primary backgrounds |

### Secondary & Accent Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--secondary` | `#e0f2fe` | Secondary backgrounds (light blue tint) |
| `--secondary-foreground` | `#4b5563` | Text on secondary backgrounds |
| `--accent` | `#d1fae5` | Subtle green highlight backgrounds |
| `--accent-foreground` | `#374151` | Text on accent backgrounds |

### UI Component Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--card` | `#ffffff` | Card backgrounds |
| `--card-foreground` | `#374151` | Card text |
| `--popover` | `#ffffff` | Popover/dropdown backgrounds |
| `--popover-foreground` | `#374151` | Popover text |
| `--muted` | `#f3f4f6` | Muted/disabled backgrounds |
| `--muted-foreground` | `#6b7280` | Muted/placeholder text |

### Utility & Form Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--border` | `#e5e7eb` | Borders and dividers |
| `--input` | `#e5e7eb` | Input borders |
| `--ring` | `#22c55e` | Focus rings |

### Status & Feedback Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--destructive` | `#ef4444` | Error states, delete actions |
| `--destructive-foreground` | `#ffffff` | Text on destructive backgrounds |

### Rules
- **Never use `lime-*`, `emerald-*`, or other green-adjacent Tailwind palettes** — only `green-*` for brand green
- **Never use black borders** — no `border-black`, `border-gray-900`, or `border-[#000]`. Use `border-gray-200` or `border-gray-300` for borders
- **Background must be neutral white-gray** — use `bg-gray-50` (#f9fafb) or `bg-white` for page/section backgrounds. Never use blue-tinted backgrounds like `#f0f8ff`
- **For hardcoded hex values** (Konva canvas, inline styles), use `#22c55e` for brand green
- **Prefer semantic Tailwind classes** (`bg-primary`, `text-muted-foreground`, `border-border`) over raw hex values
- When you need green shades not covered by the CSS variables, use Tailwind's `green-*` palette (e.g., `green-50`, `green-100`, `green-600`)

### Common usage

```tsx
// Primary buttons
className="bg-green-500 hover:bg-green-600 text-white"

// Focus rings on inputs
className="focus:border-green-400 focus:ring-green-400/20"

// Text links
className="text-green-600 hover:text-green-700"

// Icons
className="text-green-500"

// Subtle green backgrounds
className="bg-green-50 border-green-200"

// Canvas/Konva hex values
stroke="#22c55e"

// Using semantic tokens
className="bg-primary text-primary-foreground"
className="text-muted-foreground"
className="border-border"
```

## UI Components

### Overview
This project uses [shadcn/ui](https://ui.shadcn.com/) components for all UI elements. Always prefer shadcn components over custom implementations or third-party component libraries.

### Component Philosophy

1. **Always use shadcn components**: For any UI element (buttons, badges, inputs, dialogs, etc.), check if a shadcn component exists first
2. **No custom components**: Do not create custom button, badge, chip, or form components - use the shadcn equivalents
3. **Consistent styling**: Use shadcn variants and Tailwind classes for customization

### Common Components

- **Buttons**: Use `Button` from `@/components/ui/button`
  ```tsx
  import { Button } from "@/components/ui/button";

  <Button variant="default">Primary</Button>
  <Button variant="outline">Secondary</Button>
  <Button variant="ghost">Ghost</Button>
  <Button size="sm">Small</Button>
  <Button size="icon">Icon</Button>
  ```

- **Badges/Chips**: Use `Badge` from `@/components/ui/badge`
  ```tsx
  import { Badge } from "@/components/ui/badge";

  <Badge variant="default">Active</Badge>
  <Badge variant="outline">Inactive</Badge>
  <Badge variant="secondary">Info</Badge>
  ```

- **Inputs**: Use `Input` from `@/components/ui/input`
  ```tsx
  import { Input } from "@/components/ui/input";

  <Input placeholder="Enter text..." />
  ```

- **Forms**: Use form components from `@/components/ui/form`
- **Dialogs/Modals**: Use `Dialog` from `@/components/ui/dialog`
- **Dropdowns**: Use `DropdownMenu` from `@/components/ui/dropdown-menu`

### Adding New Components

If a shadcn component doesn't exist in the project:

1. Install it using: `npx shadcn@latest add [component-name]`
2. Import and use it in your code
3. Never create a custom implementation if shadcn provides it

### Customization

Customize shadcn components using:
- Variant props (e.g., `variant="outline"`)
- Size props (e.g., `size="sm"`)
- Tailwind className for additional styling

```tsx
<Button
  variant="outline"
  size="sm"
  className="bg-green-500 hover:bg-green-600"
>
  Custom Button
</Button>
```

## Toast Notifications

### Overview
This project uses [Sonner](https://sonner.emilkowal.ski/) for toast notifications. Toast notifications should be shown for almost all user interactions to provide clear feedback.

### Implementation

#### Setup
The Toaster component is configured in [providers.tsx](apps/web/src/app/providers.tsx):

```tsx
import { Toaster } from '@/components/ui/sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      {children}
      <Toaster />
    </HeroUIProvider>
  );
}
```

#### Usage
Import and use toast in your components:

```tsx
import { toast } from "sonner";

// Success notification
toast.success("Table updated successfully");

// Error notification
toast.error("Failed to update table");
```

### When to Show Toasts

Show toast notifications for:
- **Create operations**: "Table created successfully"
- **Update operations**: "Table updated successfully"
- **Delete operations**: "Table deleted successfully"
- **Duplicate operations**: "Table duplicated successfully"
- **Save operations**: "Changes saved successfully"
- **Error states**: "Failed to [action]"
- **Form submissions**: Success or validation errors
- **API interactions**: Success or failure feedback
- **User actions**: Almost all user-initiated actions should have toast feedback

### Best Practices

1. **Be specific**: Use clear, action-specific messages
   - Good: "Table updated successfully"
   - Bad: "Success"

2. **Handle errors**: Always provide error feedback
   ```tsx
   try {
     await updateTable(data);
     toast.success("Table updated successfully");
   } catch (error) {
     toast.error("Failed to update table");
   }
   ```

3. **Consistent messaging**: Follow the pattern "[Action] [result] successfully" for success messages

4. **User-centric**: Phrase messages from the user's perspective, not the system's

### Examples

See [PropertiesPanel.tsx](apps/web/src/modules/dashboard/components/LeftSidebar/PropertiesPanel.tsx) for reference implementation:

```tsx
// Save action
const result = await updateTable(selectedTable.id, updates);
if (result.success) {
  updateTable(selectedTable.id, updates);
  toast.success("Table updated successfully");
} else {
  toast.error("Failed to update table");
}

// Duplicate action
const duplicateResult = await createTable(duplicateData);
if (duplicateResult.success && duplicateResult.data) {
  toast.success("Table duplicated successfully");
}

// Delete action
const deleteResult = await deleteTable(selectedTable.id);
if (deleteResult.success) {
  toast.success("Table deleted successfully");
}
```

## Build & Lint Rules

- **Never run `next build` or `npm run build` at the end of a task** — the dev server handles incremental compilation. Running a full build is slow and unnecessary during development.
