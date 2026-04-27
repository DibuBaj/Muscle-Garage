import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { WorkoutButton } from '@/features/workout-log/components/WorkoutButton';

type WorkoutEmptyStateProps = {
  onCreateSession: () => void;
};

export function WorkoutEmptyState({ onCreateSession }: WorkoutEmptyStateProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.iconWrap}>
        <Ionicons name="barbell-outline" size={36} color={Colors.primary} />
      </View>
      <Text style={styles.title}>No workout sessions yet</Text>
      <Text style={styles.subtitle}>
        Start logging your training to track progress and stay consistent.
      </Text>
      <WorkoutButton label="Create New Workout Session" onPress={onCreateSession} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(255,165,0,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    color: Colors.lightGray,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    width: '100%',
    marginTop: 24,
  },
});
