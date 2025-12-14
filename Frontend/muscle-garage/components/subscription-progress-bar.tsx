import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

interface SubscriptionProgressBarProps {
  daysLeft: number;
  totalDays: number;
}

export default function SubscriptionProgressBar({
  daysLeft,
  totalDays,
}: SubscriptionProgressBarProps) {
  const percentage = totalDays > 0 ? (daysLeft / totalDays) * 100 : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.daysText}>{daysLeft} days left</Text>
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${percentage}%`,
            },
          ]}
        />
      </View>
      <Text style={styles.totalDays}>Total: {totalDays} days</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  daysText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#333333',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  totalDays: {
    fontSize: 12,
    color: Colors.lightGray,
  },
});
