# Icon Wrapper

App-themed icon component with predefined sizes and variants.

## Usage

```tsx
import { Icon } from '../wrapper/icon';

<Icon name="pill" size="lg" variant="primary" />
```

## Props

- `name`: Icon name from `MaterialCommunityIcons`
- `size`: Predefined size ('xs', 'sm', 'md', 'lg', 'xl') or a number
- `color`: Override color
- `variant`: Themed color variant ('primary', 'secondary', 'error', 'onSurface', 'onSurfaceVariant')
