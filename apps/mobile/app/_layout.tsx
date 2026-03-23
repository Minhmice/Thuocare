import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { MobileAuthProvider, useMobileAuth } from '@/lib/auth/mobile-auth';
import { Text, View } from '@/components/Themed';

import '../global.css';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <MobileAuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthBootGate />
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </MobileAuthProvider>
  );
}

function AuthBootGate() {
  const router = useRouter();
  const segments = useSegments();
  const { actor, actorStatus, bootstrapStatus, session } = useMobileAuth();

  useEffect(() => {
    if (bootstrapStatus === 'loading') return;

    const segmentList = segments as string[];
    const rootSegment = segmentList[0];
    const screenSegment = segmentList[1];
    const inAuthGroup = rootSegment === '(auth)';

    if (!session) {
      if (!(inAuthGroup && screenSegment === 'sign-in')) {
        router.replace('/(auth)/sign-in');
      }
      return;
    }

    if (actorStatus === 'loading') {
      return;
    }

    if (actorStatus === 'error' || actor === null || actor.kind === 'unresolved') {
      if (!(inAuthGroup && screenSegment === 'resolve-account')) {
        router.replace('/(auth)/resolve-account');
      }
      return;
    }

    if (actor.kind === 'staff') {
      if (!(inAuthGroup && screenSegment === 'unsupported')) {
        router.replace('/(auth)/unsupported');
      }
      return;
    }

    if (rootSegment !== '(tabs)') {
      router.replace('/(tabs)');
    }
  }, [actor, actorStatus, bootstrapStatus, router, segments, session]);

  const isBooting = bootstrapStatus === 'loading' || (session !== null && actorStatus === 'loading');

  if (!isBooting) {
    return null;
  }

  return (
    <View style={styles.bootGate}>
      <ActivityIndicator size="small" />
      <Text style={styles.bootGateText}>Restoring secure session...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bootGate: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    zIndex: 10,
  },
  bootGateText: {
    fontSize: 14,
  },
});
