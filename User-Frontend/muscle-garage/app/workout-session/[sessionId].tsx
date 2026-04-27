import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useWorkoutLog } from '@/context/WorkoutLogContext';
import { ExerciseBuilderCard } from '@/features/workout-log/components/ExerciseBuilderCard';
import { ExercisePickerModal } from '@/features/workout-log/components/ExercisePickerModal';
import { WorkoutButton } from '@/features/workout-log/components/WorkoutButton';
import { WorkoutInput } from '@/features/workout-log/components/WorkoutInput';
import { useWorkoutSessionBuilder } from '@/features/workout-log/hooks/useWorkoutSessionBuilder';
import { validateWorkoutDraft } from '@/features/workout-log/hooks/useWorkoutValidation';
import { WorkoutSessionDraft } from '@/features/workout-log/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function WorkoutSessionDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId?: string }>();
  const { sessions, loading, updateWorkoutSession, deleteWorkoutSession } = useWorkoutLog();
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const session = useMemo(
    () => sessions.find((entry) => entry.id === params.sessionId),
    [sessions, params.sessionId]
  );

  const initialDraft = useMemo<WorkoutSessionDraft | undefined>(() => {
    if (!session) {
      return undefined;
    }

    return {
      title: session.title,
      exercises: session.exercises.map((exercise) => ({
        exerciseId: exercise.exerciseId,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        sets: exercise.sets.map((set) => ({
          id: set.id,
          weight: String(set.weightKg),
          reps: String(set.reps),
        })),
      })),
    };
  }, [session]);

  const {
    title,
    exercises,
    setTitle,
    addExercises,
    addSet,
    removeSet,
    updateSet,
    removeExercise,
    draft,
  } = useWorkoutSessionBuilder(initialDraft);

  useEffect(() => {
    setErrors([]);
  }, [title, exercises]);

  const animateLayout = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  const handleSave = async () => {
    if (!session) {
      return;
    }

    const validationErrors = validateWorkoutDraft(draft);
    if (validationErrors.length > 0) {
      setErrors(validationErrors.slice(0, 3));
      return;
    }

    setSaveLoading(true);
    try {
      await updateWorkoutSession(session.id, draft);
      Alert.alert('Updated', 'Workout session updated successfully.');
      router.back();
    } catch {
      setErrors(['Unable to update workout session right now. Please try again.']);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = () => {
    if (!session || deleteLoading) {
      return;
    }

    Alert.alert(
      'Delete Workout Session',
      'Are you sure you want to delete this workout session? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleteLoading(true);
            try {
              await deleteWorkoutSession(session.id);
              router.back();
            } catch {
              setErrors(['Unable to delete workout session right now. Please try again.']);
            } finally {
              setDeleteLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Workout Session</Text>
          <View style={styles.iconSpacer} />
        </View>
        <View style={styles.centerWrap}>
          <Text style={styles.notFoundTitle}>Session not found</Text>
          <Text style={styles.notFoundSubtitle}>This workout session may have been removed.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={22} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Workout Session</Text>
            <TouchableOpacity
              onPress={handleDelete}
              disabled={deleteLoading}
              style={[styles.iconButton, styles.deleteButton, deleteLoading && styles.disabledButton]}
            >
              <Ionicons name="trash-outline" size={18} color={Colors.error} />
            </TouchableOpacity>
          </View>

          <WorkoutInput
            label="Workout Session Title"
            value={title}
            onChangeText={setTitle}
            placeholder="Workout title"
          />

          <WorkoutButton label="Add Exercise" variant="secondary" onPress={() => setShowExercisePicker(true)} />

          {errors.length > 0 && (
            <View style={styles.errorWrap}>
              {errors.map((error) => (
                <Text key={error} style={styles.errorText}>
                  • {error}
                </Text>
              ))}
            </View>
          )}

          {exercises.map((exercise) => (
            <ExerciseBuilderCard
              key={exercise.exerciseId}
              exercise={exercise}
              onAddSet={(exerciseId) => {
                animateLayout();
                addSet(exerciseId);
              }}
              onRemoveSet={(exerciseId, setId) => {
                animateLayout();
                removeSet(exerciseId, setId);
              }}
              onUpdateSet={updateSet}
              onRemoveExercise={(exerciseId) => {
                animateLayout();
                removeExercise(exerciseId);
              }}
            />
          ))}

          <WorkoutButton
            label="Save Changes"
            onPress={handleSave}
            loading={saveLoading}
            disabled={saveLoading || deleteLoading}
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <ExercisePickerModal
        visible={showExercisePicker}
        onClose={() => setShowExercisePicker(false)}
        onContinue={(selectedExercises) => {
          animateLayout();
          addExercises(selectedExercises);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 60,
    gap: 12,
  },
  header: {
    marginTop: 8,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '800',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardBackground,
  },
  iconSpacer: {
    width: 36,
    height: 36,
  },
  deleteButton: {
    backgroundColor: 'rgba(196, 23, 23, 0.12)',
    borderWidth: 1,
    borderColor: Colors.error,
  },
  disabledButton: {
    opacity: 0.6,
  },
  errorWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(196,23,23,0.4)',
    backgroundColor: 'rgba(196,23,23,0.12)',
    padding: 10,
    gap: 4,
  },
  errorText: {
    color: '#ff8a8a',
    fontSize: 13,
    lineHeight: 18,
  },
  saveButton: {
    marginTop: 8,
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  notFoundTitle: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '800',
  },
  notFoundSubtitle: {
    marginTop: 8,
    color: Colors.lightGray,
    textAlign: 'center',
  },
});
