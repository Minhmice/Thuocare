import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function RefillSuccessNotice() {
  return (
    <View style={styles.card}>
      <Text style={styles.icon}>✅</Text>
      <Text style={styles.title}>Gửi yêu cầu thành công</Text>
      <Text style={styles.body}>Yêu cầu cấp lại thuốc đã được gửi thành công. Phòng khám sẽ sớm phản hồi cho bạn.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  icon: {
    fontSize: 24,
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065f46',
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    color: '#047857',
    textAlign: 'center',
    lineHeight: 20,
  }
});
