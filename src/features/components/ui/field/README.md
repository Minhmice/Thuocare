# Field Primitive

Base field component for grouping inputs with labels and errors.

## Usage

```tsx
import { Field } from './field';
import { Input } from '../input';

<Field label="Name" required error="Field is required">
  <Input placeholder="Enter your name" />
</Field>
```

## Props

- `label`: Label text
- `error`: Error message or boolean
- `hint`: Hint text
- `required`: Show required asterisk
- Standard `ViewProps`
