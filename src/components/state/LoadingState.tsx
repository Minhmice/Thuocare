import { ActivityIndicator } from "react-native-paper";
import { AppScreen } from "../ui/AppScreen";

export function LoadingState() {
  return (
    <AppScreen scrollable={false}>
      <ActivityIndicator animating size="large" />
    </AppScreen>
  );
}
