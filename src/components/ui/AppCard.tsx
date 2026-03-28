import type { PropsWithChildren } from "react";
import { Card } from "react-native-paper";
import type { StyleProp, ViewStyle } from "react-native";

type AppCardProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
}>;

export function AppCard({ title, subtitle, style, children }: AppCardProps) {
  return (
    <Card mode="contained" style={[{ borderRadius: 28 }, style]}>
      {(title || subtitle) && <Card.Title title={title} subtitle={subtitle} />}
      <Card.Content>{children}</Card.Content>
    </Card>
  );
}
