import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { Button } from "../../features/components/wrapper/button";
import { Icon } from "../../features/components/wrapper/icon";
import { Typography } from "../../features/components/wrapper/typography";

type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = "Đã xảy ra lỗi",
  message,
  onRetry,
}: ErrorStateProps) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: `${theme.colors.error}1A` },
        ]}
      >
        <Icon name="alert-circle-outline" size="xl" variant="error" />
      </View>

      <View style={styles.textWrap}>
        <Typography variant="headline-sm" weight="bold" align="center">
          {title}
        </Typography>
        {message ? (
          <Typography
            variant="body-md"
            color={theme.colors.onSurfaceVariant}
            align="center"
            style={styles.message}
          >
            {message}
          </Typography>
        ) : null}
      </View>

      {onRetry ? (
        <Button
          variant="primary"
          label="Thử lại"
          onPress={onRetry}
          style={styles.retryButton}
        />
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 24,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  textWrap: {
    gap: 8,
    alignItems: "center",
  },
  message: {
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 8,
    minWidth: 160,
    borderRadius: 9999,
  },
});
