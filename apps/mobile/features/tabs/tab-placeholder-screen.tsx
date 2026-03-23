import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';

type TabPlaceholderScreenProps = {
  title: string;
};

export function TabPlaceholderScreen({ title }: TabPlaceholderScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>Screen skeleton ready for Phase 1 feature work.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
  },
});
