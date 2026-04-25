# Dialog Wrapper

App-themed dialog with title, description, and actions.

## Usage

```tsx
import { Dialog } from "../wrapper/dialog";

<Dialog
  visible={visible}
  onDismiss={handleDismiss}
  title="Confirm Action"
  description="Are you sure you want to perform this action?"
  onConfirm={handleConfirm}
  confirmLabel="Proceed"
  cancelLabel="Go back"
/>;
```

## Props

- `title`: Dialog title
- `description`: Dialog description
- `onConfirm`: Callback for confirmation button
- `confirmLabel`: Label for confirmation button
- `cancelLabel`: Label for cancel button
- `confirmVariant`: 'primary' or 'error'
- `loading`: Show loading state on confirmation button
- Extends all `DialogProps`
