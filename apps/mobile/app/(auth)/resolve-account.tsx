import { Pressable, StyleSheet } from 'react-native';
import { useState } from 'react';

import { Text, View } from '@/components/Themed';
import { useMobileAuth } from '@/lib/auth/mobile-auth';

export default function ResolveAccountScreen() {
  const { actorError, refreshActor, signOut } = useMobileAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const onSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setSignOutError(null);
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : 'Failed to sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Account Setup Required</Text>
        <Text style={styles.body}>
          Your session was restored, but the account binding is incomplete. Finish onboarding on web, then return and retry.
        </Text>
        {actorError ? <Text style={styles.error}>{actorError}</Text> : null}
        {signOutError ? <Text style={styles.error}>{signOutError}</Text> : null}
        <Pressable onPress={refreshActor} style={styles.primaryButton}>
          <Text style={styles.primaryText}>Retry Actor Resolve</Text>
        </Pressable>
        <Pressable
          disabled={isSigningOut}
          onPress={onSignOut}
          style={[styles.secondaryButton, isSigningOut ? styles.buttonDisabled : null]}
        >
          <Text style={styles.secondaryText}>{isSigningOut ? 'Signing Out...' : 'Sign Out'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    borderColor: '#e5e7eb',
    borderWidth: 1,
    gap: 12,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  body: {
    color: '#4b5563',
    lineHeight: 20,
  },
  error: {
    color: '#b91c1c',
    fontSize: 13,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 44,
    marginTop: 4,
  },
  primaryText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#d1d5db',
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  secondaryText: {
    color: '#111827',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
