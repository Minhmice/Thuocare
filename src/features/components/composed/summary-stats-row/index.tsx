import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Typography } from '../../wrapper/typography';
import { SummaryStatsRowProps } from './types';

export const SummaryStatsRow: React.FC<SummaryStatsRowProps> = ({
  items,
  segmented = false,
  style,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      {items.map((item, index) => (
        <React.Fragment key={`${item.label}-${index}`}>
          {index > 0 && segmented && (
            <View
              style={[
                styles.divider,
                { backgroundColor: 'rgba(0, 88, 188, 0.10)' },
              ]}
            />
          )}
          <View style={styles.item}>
            <Typography
              variant={item.emphasize ? 'headline-md' : 'headline-sm'}
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
            {item.helperText && (
              <Typography
                variant="body-sm"
                color={theme.colors.onSurfaceVariant}
                style={styles.helperText}
              >
                {item.helperText}
              </Typography>
            )}
          </View>
        </React.Fragment>
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
  divider: {
    width: 1,
    alignSelf: 'stretch',
    marginVertical: 4,
  },
  label: {
    marginTop: 2,
    letterSpacing: 0.5,
  },
  helperText: {
    marginTop: 2,
    opacity: 0.75,
  },
});
