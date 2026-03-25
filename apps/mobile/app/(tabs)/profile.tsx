import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { TabPlaceholderScreen } from '@/features/tabs/tab-placeholder-screen';
import { PersonalMeScreen } from '@/features/personal/screens/PersonalMeScreen';
import { useLaneDetection } from '@/lib/personal/use-lane-detection';

export default function ProfileTabRoute() {
  const { lane, isLoading } = useLaneDetection();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color="#4a6670" />
        <Text style={styles.muted}>Đang tải…</Text>
      </View>
    );
  }

  if (lane === 'personal') {
    return <PersonalMeScreen />;
  }

  return <TabPlaceholderScreen title="Profile" />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  muted: { fontSize: 13, color: '#5c6f66' },
});
