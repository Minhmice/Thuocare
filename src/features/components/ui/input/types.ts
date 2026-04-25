import { TextInputProps, StyleProp, ViewStyle, TextStyle } from "react-native";

export interface InputProps extends TextInputProps {
  error?: string | boolean;
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}
