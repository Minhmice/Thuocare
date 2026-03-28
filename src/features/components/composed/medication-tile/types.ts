import { StyleProp, ViewStyle } from 'react-native';

export interface MedicationTileProps {
  name: string;
  dosage: string;
  schedule: string;
  remaining?: number;
  unit?: string;
  outOfStock?: boolean;
  active?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}
