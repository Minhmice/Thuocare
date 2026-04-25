import { Button, type ButtonProps } from "react-native-paper";

export function AppButton(props: ButtonProps) {
  return (
    <Button
      mode="contained"
      contentStyle={{ minHeight: 52 }}
      labelStyle={{ fontSize: 15 }}
      {...props}
    />
  );
}
