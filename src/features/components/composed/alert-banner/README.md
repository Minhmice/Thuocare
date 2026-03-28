# AlertBanner

Composed alert/notification banner for inline warnings and info.

## Usage

```tsx
import { AlertBanner } from './alert-banner';

<AlertBanner 
  variant="warning"
  title="Bạn đã lỡ 1 liều Paracetamol"
  actionLabel="Uống ngay"
  onAction={() => console.log('Action pressed')}
/>
```

## Props

- `variant`: 'info', 'warning', 'critical' (default: 'info')
- `title`: Alert message text
- `icon`: Optional icon name (MaterialCommunityIcons)
- `actionLabel`: Optional underlined action button text
- `onAction`: Optional callback for the action button
- `style`: Container View style
