# SliderConfirm

A high-confidence gesture component for single-action confirmations — primarily used on the Home next-dose hero for marking a dose as taken.

## Design intent

- Strongly communicates a deliberate, irreversible action (swipe rather than tap)
- Clinically minimal: white thumb on a semi-transparent dark track, readable on the primary blue hero background
- Thumb is the only interactive area — the user must grab and drag it, not tap the track

## Usage

```tsx
import { SliderConfirm } from 'src/features/components/composed/slider-confirm';

<SliderConfirm onConfirm={handleDoseTaken} />
```

### On the Home hero (primary blue background)

The default track color (`rgba(0, 0, 0, 0.15)`) is tuned for rendering on the blue hero card. No extra style props needed.

```tsx
<SliderConfirm
  label="Slide to take"
  onConfirm={() => setAllSet(true)}
/>
```

### With an async operation

When `onConfirm` starts an async operation, set `loading={true}` to block re-interaction while the operation completes.

```tsx
const [confirming, setConfirming] = useState(false);

<SliderConfirm
  loading={confirming}
  onConfirm={async () => {
    setConfirming(true);
    await markDoseTaken();
    setConfirming(false);
  }}
/>
```

### Resetting after a failed operation

If an async operation fails and the user should be able to retry, re-key the component to snap the thumb back to the start:

```tsx
const [retryKey, setRetryKey] = useState(0);

<SliderConfirm
  key={retryKey}
  onConfirm={async () => {
    const ok = await markDoseTaken();
    if (!ok) setRetryKey(k => k + 1); // resets thumb
  }}
/>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `onConfirm` | `() => void` | — | Called once when the thumb snaps to the end |
| `label` | `string` | `"Slide to confirm"` | Center track text (auto-uppercased) |
| `threshold` | `number` | `0.75` | Fraction of track width required to confirm |
| `disabled` | `boolean` | `false` | Dims and prevents interaction |
| `loading` | `boolean` | `false` | Shows spinner on thumb; prevents drag |
| `style` | `StyleProp<ViewStyle>` | — | Override track container style |

## Behavior

- Drag the thumb right past the threshold (75% by default) and release → thumb snaps to end → `onConfirm` fires
- Release before the threshold → thumb springs back to start
- OS gesture interruption (e.g., incoming call) → thumb springs back via `onPanResponderTerminate`
- `loading={true}` → spinner appears on thumb, center label hidden, no drag
- `disabled={true}` → track dimmed, no drag, chevron uses muted color

## Constraints

- Does not auto-reset after confirm. The parent controls lifecycle (unmount, re-key, or set loading).
- No haptic feedback included — use `expo-haptics` at the call site if needed.
- Track color defaults assume a dark/colored background. Override `style` for light-surface contexts.
