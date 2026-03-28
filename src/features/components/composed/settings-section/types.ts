import { StyleProp, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface SettingsItem {
  id: string;
  label: string;
  value?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
  showChevron?: boolean;
  destructive?: boolean;
}

export interface SettingsSectionProps {
  title?: string;
  items: SettingsItem[];
  style?: StyleProp<ViewStyle>;
}
