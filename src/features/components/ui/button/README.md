# Button Primitive

Base button component for Thuocare.

## Usage

```tsx
import { Button } from './button';

<Button label="Click Me" onPress={() => console.log('Pressed')} />
```

## Props

- `label`: Button text
- `variant`: primary, secondary, text, ghost, error
- `loading`: Show loading indicator
- `disabled`: Disable button
- `style`: View style for container
- `labelStyle`: Text style for label
- Standard `TouchableOpacityProps`
