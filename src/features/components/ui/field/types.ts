import { ViewProps, StyleProp, ViewStyle, TextStyle } from 'react-native';

export interface FieldProps extends ViewProps {
  label?: string;
  error?: string | boolean;
  hint?: string;
  required?: boolean;
  labelStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  errorStyle?: StyleProp<TextStyle>;
  hintStyle?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}
