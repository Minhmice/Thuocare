import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import type { PrescriptionDetailData } from '@/lib/prescription';

type Props = {
  item: PrescriptionDetailData['items'][number];
};

function safeText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const t = value.trim();
    return t.length > 0 ? t : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

export function PrescriptionDetailItem({ item }: Props) {
  const row = item.item;
  const lineLabel =
    row.line_no !== null && row.line_no !== undefined && Number.isFinite(Number(row.line_no))
      ? `Line ${row.line_no}`
      : 'Item';

  const dose =
    [safeText(row.dose_amount), safeText(row.dose_unit)].filter(Boolean).join(' ') || null;

  const lines: string[] = [];
  const freq = safeText(row.frequency_text);
  if (freq) lines.push(freq);
  const route = safeText(row.route);
  if (route) lines.push(`Route: ${route}`);
  if (row.prn_flag === true) lines.push('PRN');
  const start = safeText(row.start_date);
  const end = safeText(row.end_date);
  if (start || end) {
    lines.push([start ? `Start ${start}` : null, end ? `End ${end}` : null].filter(Boolean).join(' · '));
  }
  const status = safeText(row.status);
  if (status) lines.push(`Status: ${status}`);

  const instruction = safeText(row.patient_instruction_text);
  const admin = safeText(row.administration_instruction_text);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{lineLabel}</Text>
      {dose ? <Text style={styles.muted}>{dose}</Text> : null}
      {lines.length > 0 ? (
        <Text style={styles.body} numberOfLines={6}>
          {lines.join('\n')}
        </Text>
      ) : null}
      {instruction ? (
        <View style={styles.block}>
          <Text style={styles.label}>Patient instructions</Text>
          <Text style={styles.body}>{instruction}</Text>
        </View>
      ) : null}
      {admin ? (
        <View style={styles.block}>
          <Text style={styles.label}>Administration</Text>
          <Text style={styles.body}>{admin}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: '#e5e7eb',
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  muted: {
    color: '#6b7280',
    fontSize: 14,
  },
  label: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  block: {
    gap: 4,
  },
});
