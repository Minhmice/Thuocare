import {
  TouchableOpacityProps,
  StyleProp,
  ViewStyle,
  TextStyle
} from "react-native";

export interface CheckboxProps extends TouchableOpacityProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}
