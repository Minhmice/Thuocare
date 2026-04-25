import { StyleProp, ViewStyle } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export interface SupportSectionProps {
  title: string;
  description?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  actionLabel: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}
