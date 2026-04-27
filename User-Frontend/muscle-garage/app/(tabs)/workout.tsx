import React from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useWorkoutLog } from '@/context/WorkoutLogContext';
import { WorkoutButton } from '@/features/workout-log/components/WorkoutButton';
import { WorkoutCard } from '@/features/workout-log/components/WorkoutCard';
import { WorkoutEmptyState } from '@/features/workout-log/components/WorkoutEmptyState';

export default function WorkoutLogScreen() {
  const router = useRouter();
  const { sessions, loading, error, clearError } = useWorkoutLog();

  const goToCreateScreen = () => {
    clearError();
    router.push('/workout-create');
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.emptyStateWrap}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Workout Log</Text>
              <Text style={styles.subtitle}>Track every set and rep</Text>
            </View>
          </View>
          <WorkoutEmptyState onCreateSession={goToCreateScreen} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Workout Log</Text>
              <Text style={styles.subtitle}>Track every set and rep</Text>
            </View>
            <WorkoutButton label="New" onPress={goToCreateScreen} style={styles.newButton} />
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {sessions.map((session) => {
            const totalSets = session.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);

            return (
              <TouchableOpacity
                key={session.id}
                activeOpacity={0.85}
                onPress={() => router.push(`/workout-session/${session.id}`)}
              >
                <WorkoutCard style={styles.sessionCard}>
                  <View style={styles.sessionHeader}>
                    <Text style={styles.sessionTitle}>{session.title}</Text>
                    <Ionicons name="barbell" size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.sessionMeta}>
                    {session.exercises.length} exercises • {totalSets} sets
                  </Text>
                  <Text style={styles.sessionDate}>
                    {new Date(session.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </WorkoutCard>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  emptyStateWrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 60,
  },
  headerRow: {
    marginTop: 8,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 2,
    color: Colors.lightGray,
    fontSize: 14,
  },
  newButton: {
    minWidth: 86,
    minHeight: 42,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 60,
    gap: 12,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
  },
  sessionCard: {
    gap: 6,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionTitle: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    paddingRight: 12,
  },
  sessionMeta: {
    color: Colors.lightGray,
    fontSize: 13,
  },
  sessionDate: {
    color: Colors.darkGray,
    fontSize: 12,
  },
});
