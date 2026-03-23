import { Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useMobileAuth } from '@/lib/auth/mobile-auth';

export default function UnsupportedActorScreen() {
  const { signOut } = useMobileAuth();

  const onSignOut = async () => {
    await signOut();
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Account Not Supported on Mobile</Text>
        <Text style={styles.body}>
          This mobile app currently supports patient accounts only. Please use the web portal for doctor/staff access.
        </Text>
        <Pressable onPress={onSignOut} style={styles.button}>
          <Text style={styles.buttonText}>Sign Out</Text>
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
});
