import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Typography } from '../../wrapper/typography';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  rightSlot,
  style,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.textContainer}>
        <Typography variant="headline-md" weight="bold">
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body-md"
            color={theme.colors.onSurfaceVariant}
            style={styles.subtitle}
          >
            {subtitle}
          </Typography>
        )}
      </View>
      {rightSlot && <View style={styles.rightSlot}>{rightSlot}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
  },
  textContainer: {
    flex: 1,
  },
  subtitle: {
    marginTop: 2,
  },
  rightSlot: {
    marginLeft: 16,
  },
});
