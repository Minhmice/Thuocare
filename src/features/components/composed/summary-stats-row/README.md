# SummaryStatsRow

Compact quick-summary strip for 2-4 items with label/value hierarchy.

## Usage

```tsx
import { SummaryStatsRow } from './summary-stats-row';

<SummaryStatsRow 
  items={[
    { label: 'Đã uống', value: 3, color: '#0058BC' },
    { label: 'Còn lại', value: 4 },
    { label: 'Quên', value: 0, color: '#C41E1E' },
  ]}
/>
```

## Props

- `items`: An array of `StatItem` objects
  - `label`: Label text (rendered in uppercase label-sm)
  - `value`: Numerical or text value (rendered in headline-sm bold)
  - `color`: Optional text color for the value
  - `emphasize`: (Reserved for future visual emphasis)
- `style`: Container View style
