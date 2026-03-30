import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { IconButton, Menu, useTheme } from 'react-native-paper';
import { Card } from '../../wrapper/card';
import { Typography } from '../../wrapper/typography';
import { Icon } from '../../wrapper/icon';
import { MedicationTileProps } from './types';
import { useLanguage } from '../../../../lib/i18n/LanguageProvider';

export const MedicationTile: React.FC<MedicationTileProps> = ({
  name,
  dosage,
  schedule,
  remaining,
  unit = 'liều',
  outOfStock = false,
  active = false,
  lowStock = false,
  highlighted = false,
  stockLabel,
  onPress,
  showMenu = false,
  onEditPress,
  onDeletePress,
  style,
}) => {
  const theme = useTheme();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const accentColor = outOfStock
    ? '#9BA0AD'
    : lowStock
    ? '#A86700'
    : theme.colors.primary;
  const backgroundColor = highlighted
    ? 'rgba(0, 88, 188, 0.08)'
    : outOfStock
    ? '#E4E4EF'
    : theme.colors.surfaceVariant;
  const nameColor = outOfStock
    ? theme.colors.onSurfaceVariant
    : theme.colors.onSurface;
  const detailColor = theme.colors.onSurfaceVariant;
  const resolvedStockLabel =
    stockLabel !== undefined
      ? stockLabel
      : remaining === undefined
      ? null
      : outOfStock
      ? 'Out of stock'
      : `${remaining} ${unit} remaining`;
  const resolvedStockColor = outOfStock
    ? '#9F1D1D'
    : lowStock
    ? '#A86700'
    : detailColor;

  const content = (
    <Card
      variant="flat"
      padding={0}
      style={[styles.container, { backgroundColor }, style]}
    >
      <View style={styles.innerContainer}>
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

        <View style={styles.contentWrapper}>
          <View style={styles.headerRow}>
            <Typography
              variant="title-md"
              weight="bold"
              numberOfLines={2}
              style={[styles.name, { color: nameColor, opacity: active ? 1 : 0.98 }]}
            >
              {name}
            </Typography>
            <View style={styles.headerTrailing}>
              {outOfStock && (
                <View style={[styles.badge, styles.badgeOut]}>
                  <Typography variant="label-sm" color="#9F1D1D" weight="bold">
                    HẾT
                  </Typography>
                </View>
              )}
              {!outOfStock && lowStock && (
                <View style={[styles.badge, styles.badgeLow]}>
                  <Typography variant="label-sm" color="#7A4A00" weight="bold">
                    SẮP HẾT
                  </Typography>
                </View>
              )}
              {showMenu && (onEditPress || onDeletePress) ? (
                <Menu
                  visible={menuOpen}
                  onDismiss={() => setMenuOpen(false)}
                  contentStyle={styles.menuSurface}
                  anchor={
                    <IconButton
                      icon="dots-vertical"
                      size={20}
                      onPress={() => setMenuOpen(true)}
                      accessibilityLabel="Medication actions"
                      style={styles.menuAnchor}
                    />
                  }
                >
                  {onEditPress ? (
                    <Menu.Item
                      onPress={() => {
                        setMenuOpen(false);
                        onEditPress();
                      }}
                      title={t("meds_tileEdit")}
                      titleStyle={{ color: theme.colors.primary }}
                    />
                  ) : null}
                  {onDeletePress ? (
                    <Menu.Item
                      onPress={() => {
                        setMenuOpen(false);
                        onDeletePress();
                      }}
                      title={t("meds_tileDelete")}
                      titleStyle={{ color: theme.colors.error }}
                    />
                  ) : null}
                </Menu>
              ) : null}
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Icon name="pill" size="xs" variant="onSurfaceVariant" />
              <Typography variant="body-sm" color={detailColor} style={styles.detailText}>
                {dosage}
              </Typography>
            </View>
            <View style={styles.detailItem}>
              <Icon name="clock-outline" size="xs" variant="onSurfaceVariant" />
              <Typography variant="body-sm" color={detailColor} style={styles.detailText}>
                {schedule}
              </Typography>
            </View>
          </View>

          {resolvedStockLabel != null && (
            <View style={styles.stockRow}>
              <Typography variant="label-sm" color={resolvedStockColor}>
                {resolvedStockLabel}
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
    marginHorizontal: 2,
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
    gap: 4,
  },
  headerTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 2,
  },
  menuAnchor: {
    margin: 0,
  },
  /** Override MD3 elevation tint (primary-blended mauve surface). */
  menuSurface: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0, 88, 188, 0.14)"
  },
  name: {
    flex: 1,
    marginRight: 4,
    minWidth: 0,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeLow: {
    backgroundColor: 'rgba(168, 103, 0, 0.12)',
  },
  badgeOut: {
    backgroundColor: 'rgba(159, 29, 29, 0.12)',
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
