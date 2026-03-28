import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Card } from '../../wrapper/card';
import { Typography } from '../../wrapper/typography';
import { Icon } from '../../wrapper/icon';
import { Button } from '../../wrapper/button';
import { SupportSectionProps } from './types';

export const SupportSection: React.FC<SupportSectionProps> = ({
  title,
  description,
  icon = 'help-circle-outline',
  actionLabel,
  onPress,
  style,
}) => {
  const theme = useTheme();

  return (
    <Card variant="flat" style={[styles.container, style]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon name={icon} size="md" variant="primary" />
        </View>
        <View style={styles.textContainer}>
          <Typography variant="title-md" weight="bold">
            {title}
          </Typography>
          {description && (
            <Typography
              variant="body-sm"
              color={theme.colors.onSurfaceVariant}
              style={styles.description}
            >
              {description}
            </Typography>
          )}
        </View>
      </View>
      <Button
        variant="secondary"
        label={actionLabel}
        onPress={onPress}
        style={[styles.button, { backgroundColor: theme.colors.surface }]}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  iconContainer: {
    marginRight: 16,
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  description: {
    marginTop: 4,
    lineHeight: 18,
  },
  button: {
    width: '100%',
  },
});
