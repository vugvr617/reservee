# Claude Development Guidelines

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
