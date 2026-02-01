# Claude Development Guidelines

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
  className="bg-lime-500 hover:bg-lime-600"
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
