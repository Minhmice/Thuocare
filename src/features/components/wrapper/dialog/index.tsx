import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Dialog as DialogPrimitive, DialogProps } from '../../ui/dialog';
import { Button } from '../button';
import { Typography } from '../typography';

export interface DialogWrapperProps extends DialogProps {
  title?: string;
  description?: string;
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'error';
  loading?: boolean;
}

export const Dialog: React.FC<DialogWrapperProps> = ({
  title,
  description,
  onConfirm,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  loading = false,
  children,
  ...props
}) => {
  const theme = useTheme();

  return (
    <DialogPrimitive {...props} contentStyle={[{ backgroundColor: theme.colors.surface }, props.contentStyle]}>
      <View style={styles.header}>
        {title && (
          <Typography variant="headline-sm" weight="bold" style={styles.title}>
            {title}
          </Typography>
        )}
        {description && (
          <Typography variant="body-md" color={theme.colors.onSurfaceVariant} style={styles.description}>
            {description}
          </Typography>
        )}
      </View>
      
      {children && <View style={styles.body}>{children}</View>}

      {(!!onConfirm || !!props.onDismiss) && (
        <View style={styles.actions}>
          <Button
            variant="text"
            label={cancelLabel}
            onPress={props.onDismiss}
            style={styles.actionButton}
            disabled={loading}
          />
          {onConfirm && (
            <Button
              variant={confirmVariant}
              label={confirmLabel}
              onPress={onConfirm}
              loading={loading}
              style={styles.actionButton}
            />
          )}
        </View>
      )}
    </DialogPrimitive>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
  },
  description: {
    lineHeight: 20,
  },
  body: {
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    minWidth: 80,
  },
});
