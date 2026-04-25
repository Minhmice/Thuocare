# SettingsSection

Composed component for grouped settings rows in the `Me` screen.

## Usage

```tsx
import { SettingsSection } from "./settings-section";

<SettingsSection
  title="Account"
  items={[
    {
      id: "profile",
      label: "Profile Info",
      icon: "account-outline",
      onPress: () => console.log("Profile")
    },
    {
      id: "security",
      label: "Security",
      icon: "lock-outline",
      value: "Protected",
      onPress: () => console.log("Security")
    }
  ]}
/>;
```

## Props

- `title`: Optional section title (rendered in uppercase label-md)
- `items`: An array of `SettingsItem` objects
  - `id`: Unique identifier
  - `label`: Main row text
  - `value`: Optional secondary text on the right
  - `icon`: Optional icon name (MaterialCommunityIcons)
  - `onPress`: Callback when row is tapped
  - `showChevron`: Optional boolean to show/hide the right chevron (default: true)
  - `destructive`: Optional boolean to render text/icon in error color
- `style`: Container View style
