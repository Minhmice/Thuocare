import React from 'react';
import { View, StyleSheet, Modal, TouchableWithoutFeedback, Animated, Dimensions, PanResponder } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface SheetProps {
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
  height?: number;
  dismissable?: boolean;
}

export const Sheet: React.FC<SheetProps> = ({
  visible,
  onDismiss,
  children,
  height = SCREEN_HEIGHT * 0.5,
  dismissable = true,
}) => {
  const [panY] = React.useState(new Animated.Value(SCREEN_HEIGHT));
  
  React.useEffect(() => {
    if (visible) {
      Animated.spring(panY, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(panY, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, panY]);

  const handleDismiss = () => {
    if (dismissable) {
      Animated.timing(panY, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }).start(onDismiss);
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={handleDismiss}
      animationType="none"
    >
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.sheet,
                {
                  height,
                  transform: [{ translateY: panY }],
                },
              ]}
            >
              <View style={styles.handle} />
              {children}
            </Animated.View>
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
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
});
