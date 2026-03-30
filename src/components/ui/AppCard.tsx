import type { PropsWithChildren } from "react";
import { Card } from "react-native-paper";
import type { StyleProp, ViewStyle } from "react-native";

type AppCardProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
  /** Overrides default padding on `Card.Content` (e.g. `{ padding: 0 }`). */
  contentStyle?: StyleProp<ViewStyle>;
}>;

export function AppCard({
  title,
  subtitle,
  style,
  contentStyle,
  children,
}: AppCardProps) {
  return (
    <Card mode="contained" style={[{ borderRadius: 28 }, style]}>
      {(title || subtitle) && <Card.Title title={title} subtitle={subtitle} />}
      <Card.Content style={contentStyle}>{children}</Card.Content>
    </Card>
  );
}
