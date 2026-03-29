import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { SummaryStatsRow } from './index';
import { SummaryStatsRowProps } from './types';

interface SummaryStatsCardProps extends SummaryStatsRowProps {
  containerStyle?: ViewStyle;
}

export const SummaryStatsCard: React.FC<SummaryStatsCardProps> = (props) => {
  const { containerStyle, ...rowProps } = props;

  return (
    <View style={[styles.card, containerStyle]}>
      <SummaryStatsRow {...rowProps} segmented />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
});
