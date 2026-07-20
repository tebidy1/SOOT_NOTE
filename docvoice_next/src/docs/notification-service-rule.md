---
trigger: always_on
---

# Rule: Centralized Notification Service

## Core Principle
All toast-style notifications MUST be displayed using the centralized `notification.service.ts`. This ensures consistency, prevents duplicate notifications, and centralizes control over how feedback is presented to the user.

## Forbidden Action
You are strictly forbidden from importing and using `toast` directly from the `sonner` library in any component or service other than `notification.service.ts` itself.

```typescript
// ❌ INCORRECT AND FORBIDDEN
import { toast } from 'sonner';

function MyComponent() {
  const handleClick = () => {
    toast.success('This is a direct, forbidden usage.');
  }
  return <button onClick={handleClick}>Show Toast</button>;
}
```

## Required Usage
Always import and use the exported functions from `notification.service.ts`.

```typescript
// ✅ CORRECT
import { showSuccess, showError } from '@/lib/services/notification.service';

function MyComponent() {
  const handleClick = () => {
    // Use the centralized service function
    showSuccess('This is the correct, centralized way to show a notification.');
  }
  return <button onClick={handleClick}>Show Toast</button>;
}
```

## Available Functions
Use the appropriate function for the type of message you want to display:

-   `showSuccess(message: string, config?: ExternalToast)`: For successful operations.
-   `showError(message: string, config?: ExternalToast)`: For errors.
-   `showWarning(message: string, config?: ExternalToast)`: For warnings.
-   `showInfo(message: string, config?: ExternalToast)`: For informational messages.

## API Call Handling
For handling notifications related to API calls, use the dedicated helper functions which integrate notification display with response handling.

```typescript
import { handleApiResponse, handleApiError } from '@/lib/services/notification.service';
import { api } from '@/lib/services/api'; // Your API client

async function fetchData() {
  try {
    const response = await api.get('/my-data');
    // Automatically shows success message from `response.data.message`
    const data = handleApiResponse(response); 
    return data;
  } catch (error) {
    // Automatically shows error message from `error.response.data.message`
    handleApiError(error); 
  }
}
```

By adhering to this rule, we ensure that all user-facing notifications are consistent, manageable, and easy to modify globally.
