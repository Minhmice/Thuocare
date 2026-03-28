import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Card } from '../../wrapper/card';
import { Typography } from '../../wrapper/typography';
import { Icon } from '../../wrapper/icon';
import { SettingsSectionProps, SettingsItem } from './types';

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  items,
  style,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      {title && (
        <Typography
          variant="label-md"
          weight="semi-bold"
          color={theme.colors.onSurfaceVariant}
          style={styles.title}
        >
          {title.toUpperCase()}
        </Typography>
      )}
      <Card variant="elevated" padding={0}>
        {items.map((item, index) => (
          <React.Fragment key={item.id}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={item.onPress}
              style={styles.row}
            >
              <View style={styles.leftContent}>
                {item.icon && (
                  <Icon
                    name={item.icon}
                    size="sm"
                    variant={item.destructive ? 'error' : 'onSurfaceVariant'}
                    style={styles.icon}
                  />
                )}
                <Typography
                  variant="body-md"
                  weight="medium"
                  color={item.destructive ? theme.colors.error : theme.colors.onSurface}
                >
                  {item.label}
                </Typography>
              </View>

              <View style={styles.rightContent}>
                {item.value && (
                  <Typography
                    variant="body-md"
                    color={theme.colors.onSurfaceVariant}
                    style={styles.value}
                  >
                    {item.value}
                  </Typography>
                )}
                {item.showChevron !== false && (
                  <Icon
                    name="chevron-right"
                    size="xs"
                    variant="onSurfaceVariant"
                  />
                )}
              </View>
            </TouchableOpacity>
            {index < items.length - 1 && (
              <View style={[styles.divider, { backgroundColor: theme.colors.surfaceVariant }]} />
            )}
          </React.Fragment>
        ))}
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    width: '100%',
  },
  title: {
    marginBottom: 8,
    marginLeft: 16,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    marginRight: 8,
  },
  divider: {
    height: 1,
    marginLeft: 52, // icon width (24) + margin (12) + start padding (16)
  },
});
