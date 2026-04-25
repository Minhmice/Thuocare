import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Typography } from "../../wrapper/typography";

const PRIMARY = "#0058BC";
const GRAY = "#505863";

// Define the core routes for standalone navigation
const ROUTES = [
  { name: "home", label: "Trang Chủ", icon: "home-variant" },
  { name: "meds", label: "Thuốc", icon: "pill" },
  { name: "me", label: "Tôi", icon: "account" },
];

export const MainTabBar: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();

  // Extract the current tab from the pathname (e.g., "/(tabs)/home" -> "home")
  const currentTab = pathname.split("/").pop() || "home";

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(28, insets.bottom + 8),
        },
      ]}
    >
      <View style={styles.content}>
        {ROUTES.map((route) => {
          const isFocused = currentTab === route.name;

          const onPress = () => {
            if (!isFocused) {
              // Using replace to mimic tab-switching behavior (no stack growth)
              router.replace(`/(tabs)/${route.name}` as any);
            }
          };

          return (
            <TouchableOpacity
              key={route.name}
              style={styles.tab}
              onPress={onPress}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={route.icon as any}
                size={24}
                color={isFocused ? PRIMARY : GRAY}
              />
              <Typography
                variant="label-sm"
                weight={isFocused ? "bold" : "normal"}
                style={[styles.label, { color: isFocused ? PRIMARY : GRAY }]}
              >
                {route.label}
              </Typography>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100, // High zIndex for default visibility
  },
  content: {
    flexDirection: "row",
    height: 60,
    alignItems: "center",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  label: {
    fontSize: 11,
    textTransform: "capitalize",
  },
});
