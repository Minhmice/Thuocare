import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { PrimaryButton } from "../../wrapper/button/primary";
import { Icon } from "../../wrapper/icon";
import type { IconWrapperProps } from "../../wrapper/icon";
import { Typography } from "../../wrapper/typography";

export interface EmptyStateProps {
  icon?: IconWrapperProps["name"];
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = "inbox-outline",
  title,
  description,
  actionLabel,
  onAction
}: EmptyStateProps) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();
  }, [opacity]);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: `${theme.colors.primary}1A` }
        ]}
      >
        <Icon name={icon} size="xl" variant="primary" />
      </View>

      <View style={styles.textWrap}>
        <Typography variant="headline-sm" weight="bold" align="center">
          {title}
        </Typography>
        {description ? (
          <Typography
            variant="body-md"
            color={theme.colors.onSurfaceVariant}
            align="center"
            style={styles.description}
          >
            {description}
          </Typography>
        ) : null}
      </View>

      {actionLabel && onAction ? (
        <PrimaryButton
          label={actionLabel}
          onPress={onAction}
          style={styles.actionButton}
        />
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 64,
    paddingHorizontal: 32,
    alignItems: "center",
    gap: 24
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center"
  },
  textWrap: {
    gap: 8,
    alignItems: "center"
  },
  description: {
    lineHeight: 22
  },
  actionButton: {
    marginTop: 8,
    minWidth: 180,
    borderRadius: 9999
  }
});
