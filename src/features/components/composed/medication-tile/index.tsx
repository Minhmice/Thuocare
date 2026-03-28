import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Card } from '../../wrapper/card';
import { Typography } from '../../wrapper/typography';
import { Icon } from '../../wrapper/icon';
import { MedicationTileProps } from './types';

export const MedicationTile: React.FC<MedicationTileProps> = ({
  name,
  dosage,
  schedule,
  remaining,
  unit = 'liều',
  outOfStock = false,
  active = false,
  onPress,
  style,
}) => {
  const theme = useTheme();

  const content = (
    <Card
      variant="elevated"
      padding={0} // We'll handle internal layout for the accent bar
      style={[styles.container, style]}
    >
      <View style={styles.innerContainer}>
        {/* Leading Accent Bar for Active/Important Meds */}
        {active && (
          <View
            style={[styles.accentBar, { backgroundColor: theme.colors.primary }]}
          />
        )}

        <View style={styles.contentWrapper}>
          <View style={styles.headerRow}>
            <Typography
              variant="title-md"
              weight="bold"
              numberOfLines={2}
              style={styles.name}
            >
              {name}
            </Typography>
            {outOfStock && (
              <View style={[styles.badge, { backgroundColor: theme.colors.error + '1A' }]}>
                <Typography variant="label-sm" color={theme.colors.error} weight="bold">
                  HẾT THUỐC
                </Typography>
              </View>
            )}
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Icon name="pill" size="xs" variant="onSurfaceVariant" />
              <Typography variant="body-sm" color={theme.colors.onSurfaceVariant} style={styles.detailText}>
                {dosage}
              </Typography>
            </View>
            <View style={styles.detailItem}>
              <Icon name="clock-outline" size="xs" variant="onSurfaceVariant" />
              <Typography variant="body-sm" color={theme.colors.onSurfaceVariant} style={styles.detailText}>
                {schedule}
              </Typography>
            </View>
          </View>

          {remaining !== undefined && !outOfStock && (
            <View style={styles.stockRow}>
              <Typography variant="label-sm" color={theme.colors.onSurfaceVariant}>
                Còn lại: <Typography variant="label-sm" weight="bold" color={remaining <= 5 ? theme.colors.error : theme.colors.onSurface}>
                  {remaining} {unit}
                </Typography>
              </Typography>
            </View>
          )}
        </View>
      </View>
    </Card>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    marginHorizontal: 2, // Slight offset for shadow breathability
  },
  innerContainer: {
    flexDirection: 'row',
    minHeight: 80,
  },
  accentBar: {
    width: 4,
    height: '100%',
  },
  contentWrapper: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  name: {
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 4,
  },
  stockRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F3F8',
  },
});
