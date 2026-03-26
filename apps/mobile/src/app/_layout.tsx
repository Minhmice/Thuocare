import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import type { ErrorBoundaryProps } from 'expo-router';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { type PropsWithChildren, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/shared/components/useColorScheme';
import { MobileAuthProvider, useMobileAuth } from '@/core/auth/mobile-auth';
import { useCapabilities } from '@/core/access/useCapabilities';
import { AppQueryProvider } from '@/core/query/query-provider';
import { RootErrorFallback } from '@/shared/components/root-error-fallback';
import { Text } from '@/shared/ui';

import '../../global.css';

export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <RootErrorFallback {...props} />;
}

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'),
  });

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
    <AppProviders>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthBootGate />
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </AppProviders>
  );
}

type AppProvidersProps = PropsWithChildren;

function AppProviders({ children }: AppProvidersProps) {
  return (
    <MobileAuthProvider>
      <AppQueryProvider>{children}</AppQueryProvider>
    </MobileAuthProvider>
  );
}

function AuthBootGate() {
  const router = useRouter();
  const segments = useSegments();
  const { actor, actorStatus, bootstrapStatus, session } = useMobileAuth();
  const { defaultEntry } = useCapabilities();

  useEffect(() => {
    if (bootstrapStatus === 'loading') return;

    const segmentList = segments as string[];
    const rootSegment = segmentList[0];
    const screenSegment = segmentList[1];
    const inAuthGroup = rootSegment === '(auth)';

    if (!session) {
      const unauthenticatedScreens = new Set(['sign-in', 'sign-up']);
      const canStayOnAuthScreen = inAuthGroup && screenSegment && unauthenticatedScreens.has(screenSegment);

      if (!canStayOnAuthScreen) {
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

    if (rootSegment === '(auth)') {
      router.replace(defaultEntry);
    }
  }, [actor, actorStatus, bootstrapStatus, defaultEntry, router, segments, session]);

  const isBooting = bootstrapStatus === 'loading' || (session !== null && actorStatus === 'loading');

  if (!isBooting) {
    return null;
  }

  return (
    <View className="absolute inset-0 items-center justify-center gap-3 z-10 bg-surface">
      <ActivityIndicator size="small" color="#0058BC" />
      <Text variant="bodySmall" className="text-text-variant">Restoring secure session...</Text>
    </View>
  );
}
