# MedicationTile

Composed list item for displaying medication information.

## Usage

```tsx
import { MedicationTile } from './medication-tile';

<MedicationTile
  name="Paracetamol"
  dosage="500mg"
  schedule="Sáng, Trưa, Tối"
  remaining={10}
  active={true}
  onPress={() => console.log('Tapped')}
/>
```

## Props

- `name`: Medication name (string)
- `dosage`: Dosage string (e.g. "500mg")
- `schedule`: Frequency/timing string (e.g. "Sáng, Tối")
- `remaining`: Optional stock count (number)
- `unit`: Optional unit label (default: "liều")
- `outOfStock`: Show "HẾT THUỐC" badge (boolean)
- `active`: Show primary accent bar (boolean)
- `onPress`: Optional tap handler
- `style`: Container View style
