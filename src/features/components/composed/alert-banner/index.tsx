import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
import { Card } from "../../wrapper/card";
import { Typography } from "../../wrapper/typography";
import { Icon } from "../../wrapper/icon";
import { GhostButton } from "../../wrapper/button/ghost";
import { AlertBannerProps, AlertVariant } from "./types";

export const AlertBanner: React.FC<AlertBannerProps> = ({
  variant = "info",
  title,
  description,
  icon,
  actionLabel,
  onAction,
  style
}) => {
  const theme = useTheme();

  const getVariantStyles = (v: AlertVariant) => {
    switch (v) {
      case "critical":
        return {
          background: theme.colors.error,
          text: "#FFFFFF",
          secondaryText: "rgba(255, 255, 255, 0.82)",
          icon: "#FFFFFF",
          defaultIcon: "alert-octagon"
        };
      case "warning":
        return {
          background: "rgba(200, 79, 61, 0.15)",
          text: theme.colors.tertiary,
          secondaryText: theme.colors.onSurfaceVariant,
          icon: theme.colors.tertiary,
          defaultIcon: "alert-circle"
        };
      case "info":
      default:
        return {
          background: theme.colors.surfaceVariant,
          text: theme.colors.onSurfaceVariant,
          secondaryText: theme.colors.onSurfaceVariant,
          icon: theme.colors.onSurfaceVariant,
          defaultIcon: "information"
        };
    }
  };

  const vStyles = getVariantStyles(variant);

  return (
    <Card
      variant="flat"
      padding={12}
      borderRadius={16}
      style={[{ backgroundColor: vStyles.background }, styles.container, style]}
    >
      <View style={styles.content}>
        <Icon
          name={(icon || vStyles.defaultIcon) as any}
          size="sm"
          color={vStyles.icon}
          style={styles.icon}
        />
        <View style={styles.textContent}>
          <Typography
            variant="label-lg"
            weight="semi-bold"
            style={[styles.title, { color: vStyles.text }]}
          >
            {title}
          </Typography>
          {description && (
            <Typography
              variant="body-sm"
              style={[styles.description, { color: vStyles.secondaryText }]}
            >
              {description}
            </Typography>
          )}
        </View>
      </View>
      {actionLabel && onAction && (
        <GhostButton
          label={actionLabel}
          onPress={onAction}
          labelStyle={[styles.actionLabel, { color: vStyles.text }]}
          style={styles.actionButton}
        />
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginVertical: 4
  },
  content: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1
  },
  icon: {
    marginTop: 2
  },
  textContent: {
    marginLeft: 12,
    flex: 1,
    flexShrink: 1
  },
  title: {
    flexShrink: 1
  },
  description: {
    marginTop: 4
  },
  actionButton: {
    paddingHorizontal: 0,
    height: "auto",
    marginLeft: 8,
    alignSelf: "center"
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "bold",
    textDecorationLine: "underline"
  }
});
