import * as NavigationBar from "expo-navigation-bar";
import { useEffect } from "react";
import { Platform } from "react-native";

export function AndroidNavigationBar() {
  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    NavigationBar.setVisibilityAsync("visible").catch(() => undefined);
    NavigationBar.setStyle("dark");
  }, []);

  return null;
}
