import React, { useEffect, useMemo, useState } from 'react';
import {
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useWorkoutLog } from '@/context/WorkoutLogContext';
import { useAuth } from '@/context/AuthContext';
import { ExerciseBuilderCard } from '@/features/workout-log/components/ExerciseBuilderCard';
import {
  AIGenerateFormValues,
  AIGenerateWorkoutModal,
} from '@/features/workout-log/components/AIGenerateWorkoutModal';
import { ExercisePickerModal } from '@/features/workout-log/components/ExercisePickerModal';
import { WorkoutButton } from '@/features/workout-log/components/WorkoutButton';
import { WorkoutInput } from '@/features/workout-log/components/WorkoutInput';
import { useWorkoutSessionBuilder } from '@/features/workout-log/hooks/useWorkoutSessionBuilder';
import { validateWorkoutDraft } from '@/features/workout-log/hooks/useWorkoutValidation';
import { exerciseService } from '@/features/workout-log/services/exerciseService';
import { WorkoutSessionDraft } from '@/features/workout-log/types';
import axios from 'axios';
import { API_URL } from '@/constants/api';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function CreateWorkoutSessionScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { createWorkoutSession } = useWorkoutLog();
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showAIGenerate, setShowAIGenerate] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

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
    reset,
    hydrate,
  } = useWorkoutSessionBuilder();

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) {
      return '';
    }

    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) {
      return '';
    }

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const hasHadBirthdayThisYear =
      today.getMonth() > dob.getMonth() ||
      (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());

    if (!hasHadBirthdayThisYear) {
      age -= 1;
    }

    return age > 0 ? String(age) : '';
  };

  const aiDefaultAge = useMemo(() => calculateAge(user?.dateOfBirth), [user?.dateOfBirth]);
  const aiDefaultWeight = useMemo(
    () => (typeof user?.weight === 'number' ? String(user.weight) : ''),
    [user?.weight]
  );

  useEffect(() => {
    setErrors([]);
  }, [title, exercises]);

  const canSave = useMemo(() => draft.title.trim().length > 0 && draft.exercises.length > 0, [draft]);

  const animateLayout = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  const handleSave = async () => {
    const validationErrors = validateWorkoutDraft(draft);
    if (validationErrors.length > 0) {
      setErrors(validationErrors.slice(0, 3));
      return;
    }

    setSaveLoading(true);
    try {
      await createWorkoutSession(draft);
      reset();
      Alert.alert('Saved', 'Workout session has been saved successfully.');
      router.back();
    } catch {
      setErrors(['Unable to save workout session right now. Please try again.']);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleAIGenerate = async (values: AIGenerateFormValues) => {
    setAiLoading(true);
    try {
      if (!token) {
        setErrors(['You must be logged in to use AI generation.']);
        return;
      }

      const availableExercises = await exerciseService.getExercises();
      if (!availableExercises.length) {
        setErrors(['No exercises are available right now. Please try again later.']);
        return;
      }

      const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      const response = await axios.post(
        `${API_URL}/ai/generate-workout`,
        {
          age: values.age,
          weight: values.weight,
          goal: values.goal,
          muscleGroups: values.muscleGroups,
          availableExercises,
        },
        {
          headers: {
            Authorization: authHeader,
          },
        }
      );

      const generatedDraft = response.data?.draft as WorkoutSessionDraft | undefined;
      if (!generatedDraft || !generatedDraft.title || !Array.isArray(generatedDraft.exercises)) {
        setErrors(['AI returned an invalid workout plan. Please try again.']);
        return;
      }

      if (generatedDraft.exercises.length === 0) {
        setErrors(['AI could not generate exercises for your selected categories.']);
        return;
      }

      animateLayout();
      hydrate(generatedDraft);
      setShowAIGenerate(false);
      Alert.alert('Workout Ready', 'AI has generated a workout session. Review and save it.');
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        'Failed to generate workout with AI. Please check your inputs and try again.';
      setErrors([message]);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Workout Session</Text>
          <View style={styles.iconSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <WorkoutInput
            label="Workout Session Title"
            value={title}
            onChangeText={setTitle}
            placeholder="Push Day - Week 4"
          />

          <WorkoutButton
            label="Add Exercise"
            variant="secondary"
            onPress={() => setShowExercisePicker(true)}
          />

          <WorkoutButton
            label="AI Generate"
            onPress={() => setShowAIGenerate(true)}
          />

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
            label="Save Workout Session"
            onPress={handleSave}
            loading={saveLoading}
            disabled={!canSave || saveLoading}
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

      <AIGenerateWorkoutModal
        visible={showAIGenerate}
        loading={aiLoading}
        initialAge={aiDefaultAge}
        initialWeight={aiDefaultWeight}
        onClose={() => setShowAIGenerate(false)}
        onSubmit={handleAIGenerate}
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '800',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 12,
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
});
