import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

import { Text } from '@/shared/ui';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 items-center justify-center p-5 bg-surface">
        <Text variant="h2" className="text-text font-bold mb-4">This screen doesn't exist.</Text>

        <Link href="/(tabs)" className="mt-4 py-4">
          <Text variant="bodyLarge" className="text-primary font-bold">Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}
