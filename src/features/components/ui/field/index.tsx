import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FieldProps } from './types';

export const Field: React.FC<FieldProps> = ({
  label,
  error,
  hint,
  required,
  labelStyle,
  containerStyle,
  errorStyle,
  hintStyle,
  children,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]} {...props}>
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <View style={styles.content}>{children}</View>
      {hint && !error && <Text style={[styles.hint, hintStyle]}>{hint}</Text>}
      {typeof error === 'string' && <Text style={[styles.error, errorStyle]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#374151',
  },
  required: {
    color: '#EF4444',
  },
  content: {
    width: '100%',
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  error: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
});
