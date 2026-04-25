import type { ComponentProps, PropsWithChildren } from "react";
import { Text } from "react-native-paper";

type AppTextProps = PropsWithChildren<
  ComponentProps<typeof Text> & {
    variant?: ComponentProps<typeof Text>["variant"];
  }
>;

export function AppText({
  children,
  variant = "bodyMedium",
  ...rest
}: AppTextProps) {
  return (
    <Text variant={variant} {...rest}>
      {children}
    </Text>
  );
}
