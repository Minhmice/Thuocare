import type { ErrorBoundaryProps } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';

export function RootErrorFallback({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{error.message}</Text>
      <Text onPress={retry} style={styles.retry}>
        Try again
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
  },
  retry: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
