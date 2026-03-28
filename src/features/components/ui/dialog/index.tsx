import React from 'react';
import { View, StyleSheet, Modal, TouchableWithoutFeedback, StyleProp, ViewStyle } from 'react-native';

export interface DialogProps {
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  dismissable?: boolean;
}

export const Dialog: React.FC<DialogProps> = ({
  visible,
  onDismiss,
  children,
  containerStyle,
  contentStyle,
  dismissable = true,
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onDismiss}
      animationType="fade"
    >
      <TouchableWithoutFeedback onPress={dismissable ? onDismiss : undefined}>
        <View style={[styles.overlay, containerStyle]}>
          <TouchableWithoutFeedback>
            <View style={[styles.content, contentStyle]}>
              {children}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    padding: 20,
    // Standard shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
