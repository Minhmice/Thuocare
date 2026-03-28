# SupportSection

Visual call-to-action component for help and support in the `Me` screen.

## Usage

```tsx
import { SupportSection } from './support-section';

<SupportSection 
  title="Need help?"
  description="Our clinical team is available 24/7 to answer your medication questions."
  actionLabel="Chat with Support"
  onPress={() => console.log('Support Chat')}
/>
```

## Props

- `title`: Main heading text
- `description`: Optional supporting body text
- `icon`: Optional icon name (MaterialCommunityIcons, default: 'help-circle-outline')
- `actionLabel`: Text for the primary action button
- `onPress`: Callback when the action button is tapped
- `style`: Container View style
