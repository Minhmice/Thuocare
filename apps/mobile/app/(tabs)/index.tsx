import { PrimaryButton } from '@thuocare/ui-mobile';
import { StyleSheet } from 'react-native';

import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';
import { useMobileAuth } from '@/lib/auth/mobile-auth';

export default function TabOneScreen() {
  const { actor, signOut, user } = useMobileAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thuocare Mobile</Text>
      <Text style={styles.subtitle}>Signed in as: {user?.email ?? 'Unknown user'}</Text>
      <Text style={styles.subtitle}>Actor: {actor?.kind ?? 'unresolved'}</Text>
      <PrimaryButton onPress={signOut}>Sign Out</PrimaryButton>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <EditScreenInfo path="app/(tabs)/index.tsx" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.8,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
