# Sheet Wrapper

App-themed bottom sheet for Thuocare.

## Usage

```tsx
import { Sheet } from "../wrapper/sheet";

<Sheet visible={visible} onDismiss={handleDismiss} title="Select Option">
  <View>
    <Typography>Option 1</Typography>
    <Typography>Option 2</Typography>
  </View>
</Sheet>;
```

## Props

- `title`: Optional sheet title
- `scrollable`: Wrap children in a `ScrollView` (default: true)
- Extends all `SheetProps`
