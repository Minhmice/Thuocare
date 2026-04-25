# ScreenHeader

Composed header component for screen titles and metadata.

## Usage

```tsx
import { ScreenHeader } from "./screen-header";

<ScreenHeader
  title="Chào buổi sáng, David"
  subtitle="Thứ Ba, 24 Th10"
  rightSlot={<TimeBadge time="09:00" />}
/>;
```

## Props

- `title`: Primary headline text
- `subtitle`: Optional supporting text below the title
- `rightSlot`: Optional ReactNode for the right-hand side (e.g., status chip, time badge)
- `style`: Container View style
