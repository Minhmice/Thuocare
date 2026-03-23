import { Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import type { PrescriptionPatientView } from '@thuocare/prescription';

type Props = {
  item: PrescriptionPatientView;
  onPress: () => void;
};

function formatDate(value: string | null | undefined): string {
  if (!value || typeof value !== 'string') return '—';
  return value;
}

export function PrescriptionListRowView({ item, onPress }: Props) {
  const title =
    item.patientFriendlySummary && item.patientFriendlySummary.trim().length > 0
      ? item.patientFriendlySummary.trim()
      : `Prescription`;

  const subtitleParts = [
    item.status ? String(item.status) : null,
    item.issuedAt ? `Issued ${formatDate(item.issuedAt)}` : null,
    item.effectiveFrom ? `From ${formatDate(item.effectiveFrom)}` : null,
  ].filter(Boolean);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
    >
      <View style={styles.rowInner}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitleParts.join(' · ') || '—'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    borderBottomColor: '#e5e7eb',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowPressed: {
    backgroundColor: '#f3f4f6',
  },
  rowInner: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
});
