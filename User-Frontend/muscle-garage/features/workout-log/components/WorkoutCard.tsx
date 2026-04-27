import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { Colors } from '@/constants/colors';

export function WorkoutCard({ style, ...props }: ViewProps) {
  return <View style={[styles.card, style]} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 14,
  },
});
