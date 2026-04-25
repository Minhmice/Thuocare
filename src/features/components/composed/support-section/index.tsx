import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
import { Card } from "../../wrapper/card";
import { Typography } from "../../wrapper/typography";
import { Icon } from "../../wrapper/icon";
import { SecondaryButton } from "../../wrapper/button/secondary";
import { SupportSectionProps } from "./types";

const SUPPORT_CARD_BG = "#F0F0F7";

export const SupportSection: React.FC<SupportSectionProps> = ({
  title,
  description,
  icon = "help",
  actionLabel,
  onPress,
  style
}) => {
  const theme = useTheme();

  return (
    <Card
      variant="flat"
      style={[styles.container, { backgroundColor: SUPPORT_CARD_BG }, style]}
    >
      <View style={styles.content}>
        <View
          style={[styles.iconCircle, { borderColor: theme.colors.primary }]}
        >
          <Icon name={icon} size="lg" variant="primary" />
        </View>
        <View style={styles.textContainer}>
          <Typography variant="title-md" weight="bold">
            {title}
          </Typography>
          {description && (
            <Typography
              variant="body-sm"
              color={theme.colors.onSurfaceVariant}
              style={styles.description}
            >
              {description}
            </Typography>
          )}
        </View>
      </View>
      <SecondaryButton
        label={actionLabel}
        onPress={onPress}
        style={[
          styles.button,
          {
            backgroundColor: "#FFFFFF",
            borderRadius: 16
          }
        ]}
        labelStyle={{ color: theme.colors.primary }}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    width: "100%"
  },
  content: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-start"
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    marginRight: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF"
  },
  textContainer: {
    flex: 1,
    paddingTop: 2
  },
  description: {
    marginTop: 6,
    lineHeight: 20
  },
  button: {
    width: "100%"
  }
});
