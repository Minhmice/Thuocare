import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Card } from '../../wrapper/card';
import { Typography } from '../../wrapper/typography';
import { Icon } from '../../wrapper/icon';
import { Button } from '../../wrapper/button';
import { AlertBannerProps, AlertVariant } from './types';

export const AlertBanner: React.FC<AlertBannerProps> = ({
  variant = 'info',
  title,
  icon,
  actionLabel,
  onAction,
  style,
}) => {
  const theme = useTheme();

  const getVariantStyles = (v: AlertVariant) => {
    switch (v) {
      case 'critical':
        return {
          background: theme.colors.error,
          text: '#FFFFFF',
          icon: '#FFFFFF',
          defaultIcon: 'alert-octagon',
        };
      case 'warning':
        return {
          background: 'rgba(200, 79, 61, 0.15)', // theme.colors.tertiary at 15%
          text: theme.colors.tertiary,
          icon: theme.colors.tertiary,
          defaultIcon: 'alert-circle',
        };
      case 'info':
      default:
        return {
          background: theme.colors.surfaceVariant,
          text: theme.colors.onSurfaceVariant,
          icon: theme.colors.onSurfaceVariant,
          defaultIcon: 'information',
        };
    }
  };

  const vStyles = getVariantStyles(variant);

  return (
    <Card
      variant="flat"
      padding={12}
      borderRadius={16}
      style={[
        { backgroundColor: vStyles.background },
        styles.container,
        style,
      ]}
    >
      <View style={styles.content}>
        <Icon
          name={(icon || vStyles.defaultIcon) as any}
          size="sm"
          color={vStyles.icon}
        />
        <Typography
          variant="label-lg"
          weight="semi-bold"
          style={[styles.title, { color: vStyles.text }]}
        >
          {title}
        </Typography>
      </View>
      {actionLabel && onAction && (
        <Button
          variant="text"
          label={actionLabel}
          onPress={onAction}
          labelStyle={[styles.actionLabel, { color: vStyles.text }]}
          style={styles.actionButton}
        />
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginVertical: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    marginLeft: 12,
    flexShrink: 1,
  },
  actionButton: {
    paddingHorizontal: 0,
    height: 'auto',
    marginLeft: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
