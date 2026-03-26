import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { useMobileAuth } from '@/core/auth/mobile-auth';

export default function UnsupportedActorScreen() {
  const { signOut } = useMobileAuth();
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
        <Text style={styles.title}>Account Not Supported on Mobile</Text>
        <Text style={styles.body}>
          This mobile app currently supports patient accounts only. Please use the web portal for doctor/staff access.
        </Text>
        {signOutError ? <Text style={styles.error}>{signOutError}</Text> : null}
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
