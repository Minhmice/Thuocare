import type { ReactNode } from "react";
import type { PressableProps } from "react-native";
import { Pressable, Text } from "react-native";

export function PrimaryButton({ children, ...props }: PressableProps & { children?: ReactNode }) {
  return (
    <Pressable
      className="rounded-md bg-neutral-900 px-4 py-3 active:opacity-80"
      {...props}
    >
      <Text className="text-center text-sm font-medium text-white">{children}</Text>
    </Pressable>
  );
}
