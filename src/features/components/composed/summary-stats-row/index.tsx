import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Typography } from '../../wrapper/typography';
import { SummaryStatsRowProps } from './types';

export const SummaryStatsRow: React.FC<SummaryStatsRowProps> = ({
  items,
  style,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      {items.map((item, index) => (
        <View key={`${item.label}-${index}`} style={styles.item}>
          <Typography
            variant="headline-sm"
            weight="bold"
            color={item.color || theme.colors.onSurface}
          >
            {item.value}
          </Typography>
          <Typography
            variant="label-sm"
            weight="medium"
            color={theme.colors.onSurfaceVariant}
            style={styles.label}
          >
            {item.label.toUpperCase()}
          </Typography>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
  },
  item: {
    alignItems: 'center',
    flex: 1,
  },
  label: {
    marginTop: 2,
    letterSpacing: 0.5,
  },
});
