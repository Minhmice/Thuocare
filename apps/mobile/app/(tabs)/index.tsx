import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useMobileAuth } from '@/lib/auth/mobile-auth';

export default function HomeTabRoute() {
  const { actor, actorError, actorStatus, signOut } = useMobileAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const actorKind = actor?.kind ?? 'unresolved';

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
        <Text style={styles.title}>Home</Text>
        <Text style={styles.body}>Mobile shell is connected. Auth context is shown below for Phase 1 QA.</Text>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Actor</Text>
          <Text style={styles.statusValue}>{actorKind}</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Actor Status</Text>
          <Text style={styles.statusValue}>{actorStatus}</Text>
        </View>
        {actorError ? (
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Actor Error</Text>
            <Text style={styles.errorText}>{actorError}</Text>
          </View>
        ) : null}
        {signOutError ? <Text style={styles.errorText}>{signOutError}</Text> : null}

        <Pressable
          disabled={isSigningOut}
          onPress={onSignOut}
          style={[styles.button, isSigningOut ? styles.buttonDisabled : null]}
        >
          <Text style={styles.buttonText}>{isSigningOut ? 'Signing Out...' : 'Sign Out'}</Text>
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
    fontSize: 24,
    fontWeight: '700',
  },
  body: {
    color: '#4b5563',
    lineHeight: 20,
  },
  statusRow: {
    gap: 4,
  },
  statusLabel: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusValue: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 44,
    marginTop: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
