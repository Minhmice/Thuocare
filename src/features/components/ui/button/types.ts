import { TouchableOpacityProps, StyleProp, ViewStyle, TextStyle } from 'react-native';

export interface ButtonProps extends TouchableOpacityProps {
  label?: string;
  variant?: 'primary' | 'secondary' | 'text' | 'ghost' | 'error';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}
