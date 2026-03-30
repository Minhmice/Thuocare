import { StyleProp, ViewStyle } from 'react-native';

export interface MedicationTileProps {
  name: string;
  dosage: string;
  schedule: string;
  remaining?: number;
  unit?: string;
  outOfStock?: boolean;
  active?: boolean;
  lowStock?: boolean;
  highlighted?: boolean;
  stockLabel?: string | null;
  onPress?: () => void;
  /** Show ⋮ menu with edit/delete when handlers are provided. */
  showMenu?: boolean;
  onEditPress?: () => void;
  onDeletePress?: () => void;
  style?: StyleProp<ViewStyle>;
}
