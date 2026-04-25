import { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";
import { Spinner } from "../../features/components/wrapper/spinner";
import { AppText } from "../ui/AppText";

type LoadingStateProps = {
  message?: string;
};

export function LoadingState({ message }: LoadingStateProps) {
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
      <Spinner size="lg" color="#0058BC" />
      {message ? (
        <AppText variant="bodyMedium" style={styles.message}>
          {message}
        </AppText>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 32
  },
  message: {
    color: "#5F6673",
    textAlign: "center"
  }
});
