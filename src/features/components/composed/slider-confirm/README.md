# SliderConfirm (Liquid Glass Edition)

A high-confidence gesture component for single-action confirmations, utilizing a calm, medical "Liquid Glass" iOS aesthetic. This interaction primitive is designed for critical actions where accidental taps must be prevented (e.g., marking a dose as taken).

## Design & Engineering Intent

- **Liquid Glass Aesthetic**: Uses `expo-glass-effect` for a soft translucent pill surface. Falls back gracefully to a solid translucent tint on Android/unsupported platforms.
- **Calm & Trustworthy**: Avoids emergency/game UI styling. Uses sentence case, subtle shadows, soft scaling, and a reassuring check icon upon completion.
- **Deliberate Action**: Requires a horizontal swipe rather than a tap to confirm.
- **High-Performance**: Powered by `react-native-gesture-handler` and `react-native-reanimated`, running entirely on the UI thread for fluid motion. Opacity animations are isolated inside the GlassView to avoid known rendering bugs.
- **Scroll-Friendly**: Gracefully yields to vertical scrolling (fails gesture on > 12px vertical movement), eliminating "scroll lock" issues in standard lists.
- **Tactile Feedback**: Integrated granular haptics via `expo-haptics` (Start → Impact Light, Threshold Cross → Impact Medium, Success → Notification Success).
- **Visual Polish**:
  - Dynamic opacity fading on the label as the thumb approaches.
  - Active soft translucent fill trail following the thumb.
  - Visually balanced label centering, specifically offsetting the thumb mass.
  - Icon switch (arrow → check) upon successful slide.

## Requirements

Requires `expo-glass-effect` to be installed:

```bash
npx expo install expo-glass-effect
```

_Note on limitations: `GlassView` is an iOS-first effect. On older iOS devices or Android, it will gracefully fall back to a colored tint that mimics translucent surfaces, preserving the visual cleanliness._

## Usage

```tsx
import { SliderConfirm } from "src/features/components/composed/slider-confirm";

<SliderConfirm
  label="Slide to mark all as taken"
  onConfirm={handleDoseTaken}
/>;
```

### With an async operation

When `onConfirm` triggers an async task, set `loading={true}`. The component hides the label, blocks dragging, and shows an activity indicator inside the thumb.

```tsx
const [loading, setLoading] = useState(false);

<SliderConfirm
  loading={loading}
  onConfirm={async () => {
    setLoading(true);
    await markDoseTaken();
    setLoading(false);
  }}
/>;
```

### Resetting after a failed operation

By design, the slider does not automatically reset after a successful slide. If an async operation fails and the user needs to try again, re-key the component to snap the thumb back to the start position:

```tsx
const [retryKey, setRetryKey] = useState(0);

<SliderConfirm
  key={retryKey}
  onConfirm={async () => {
    const success = await markDoseTaken();
    if (!success) setRetryKey((k) => k + 1); // Resets thumb
  }}
/>;
```

## Props

| Prop            | Type                   | Default                        | Description                                                                    |
| --------------- | ---------------------- | ------------------------------ | ------------------------------------------------------------------------------ |
| `onConfirm`     | `() => void`           | —                              | Called after the thumb snaps to the end (with a brief `SUCCESS_HOLD_MS` delay) |
| `label`         | `string`               | `"Slide to mark all as taken"` | Center track text (sentence-cased)                                             |
| `size`          | `"medium" \| "large"`  | `"medium"`                     | Visual size variant                                                            |
| `variant`       | `"dark" \| "light"`    | `"dark"`                       | Color scheme mode                                                              |
| `threshold`     | `number`               | `0.75`                         | Fraction of track width required to successfully confirm                       |
| `hapticEnabled` | `boolean`              | `true`                         | Whether to play haptics during interaction                                     |
| `disabled`      | `boolean`              | `false`                        | Dims the component and prevents interaction                                    |
| `loading`       | `boolean`              | `false`                        | Shows spinner on thumb; prevents drag                                          |
| `style`         | `StyleProp<ViewStyle>` | —                              | Override track container style                                                 |
