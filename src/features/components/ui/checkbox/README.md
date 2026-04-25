# Checkbox Primitive

Base checkbox component for Thuocare.

## Usage

```tsx
import { Checkbox } from "./checkbox";

<Checkbox
  checked={checked}
  onCheckedChange={setChecked}
  label="Accept terms"
/>;
```

## Props

- `checked`: Current checked state
- `onCheckedChange`: Callback when state changes
- `label`: Optional label text
- `disabled`: Disable interaction
- `style`: Container view style
- `labelStyle`: Text style for label
- Standard `TouchableOpacityProps`
