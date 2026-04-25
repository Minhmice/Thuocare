# Button Wrappers

App-themed button components separated into distinct modules for modularity and the signature "clinical-minimal" style. Each button type acts as a wrapper over the base `ui/button/Button` primitive.

## Available Buttons

- **PrimaryButton**: Main call to actions. Fully rounded, solid theme primary background.
- **SecondaryButton**: Less prominent actions. Standard rounding, light gray background.
- **GhostButton**: Transparent background with colored border. Good for secondary/tertiary actions.
- **DangerButton**: For destructive actions. Solid red/error background.
- **GradientButton**: For premium or highlighted actions. Uses `expo-linear-gradient` to create a smooth gradient background.

## Usage

```tsx
import { PrimaryButton } from 'src/features/components/wrapper/button/primary';
import { SecondaryButton } from 'src/features/components/wrapper/button/secondary';
import { GhostButton } from 'src/features/components/wrapper/button/ghost';
import { DangerButton } from 'src/features/components/wrapper/button/danger';
import { GradientButton } from 'src/features/components/wrapper/button/gradient';

// Basic Usage
<PrimaryButton label="Get Started" onPress={handlePress} />
<SecondaryButton label="Cancel" onPress={handlePress} />
<GhostButton label="Skip" onPress={handlePress} />
<DangerButton label="Delete Account" onPress={handlePress} />

// Gradient Usage (defaults to primary blue gradient, but accepts `colors` prop)
<GradientButton
  label="Upgrade to Premium"
  colors={['#FF7A00', '#FF004D']}
  onPress={handlePress}
/>
```

## Props

All buttons inherit standard props from `TouchableOpacity` plus:

- `label`: string
- `loading`: boolean
- `disabled`: boolean
- `style`: ViewStyle
- `labelStyle`: TextStyle
