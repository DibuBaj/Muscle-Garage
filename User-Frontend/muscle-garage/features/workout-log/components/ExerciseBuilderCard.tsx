import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { WorkoutButton } from '@/features/workout-log/components/WorkoutButton';
import { WorkoutCard } from '@/features/workout-log/components/WorkoutCard';
import { WorkoutExerciseDraft } from '@/features/workout-log/types';

type ExerciseBuilderCardProps = {
  exercise: WorkoutExerciseDraft;
  onAddSet: (exerciseId: string) => void;
  onRemoveSet: (exerciseId: string, setId: string) => void;
  onUpdateSet: (
    exerciseId: string,
    setId: string,
    field: 'weight' | 'reps',
    value: string
  ) => void;
  onRemoveExercise: (exerciseId: string) => void;
};

export function ExerciseBuilderCard({
  exercise,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  onRemoveExercise,
}: ExerciseBuilderCardProps) {
  return (
    <WorkoutCard style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Text style={styles.muscleLabel}>{exercise.muscleGroup.toUpperCase()}</Text>
        </View>
        <TouchableOpacity onPress={() => onRemoveExercise(exercise.exerciseId)}>
          <Ionicons name="trash-outline" size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.setHeaderRow}>
        <Text style={[styles.setHeader, styles.setIndex]}>Set</Text>
        <Text style={[styles.setHeader, styles.setField]}>Weight (kg)</Text>
        <Text style={[styles.setHeader, styles.setField]}>Reps</Text>
        <View style={styles.deleteSlot} />
      </View>

      {exercise.sets.map((set, index) => (
        <View key={set.id} style={styles.setRow}>
          <Text style={styles.setIndexValue}>{index + 1}</Text>
          <TextInput
            keyboardType="decimal-pad"
            value={set.weight}
            onChangeText={(value) => onUpdateSet(exercise.exerciseId, set.id, 'weight', value)}
            placeholder="0"
            placeholderTextColor={Colors.darkGray}
            style={[styles.setInput, styles.setField]}
          />
          <TextInput
            keyboardType="number-pad"
            value={set.reps}
            onChangeText={(value) => onUpdateSet(exercise.exerciseId, set.id, 'reps', value)}
            placeholder="0"
            placeholderTextColor={Colors.darkGray}
            style={[styles.setInput, styles.setField]}
          />
          <TouchableOpacity
            style={styles.deleteSlot}
            onPress={() => onRemoveSet(exercise.exerciseId, set.id)}
            disabled={exercise.sets.length <= 1}
          >
            <Ionicons
              name="remove-circle-outline"
              size={22}
              color={exercise.sets.length <= 1 ? Colors.darkGray : Colors.error}
            />
          </TouchableOpacity>
        </View>
      ))}

      <WorkoutButton label="Add Set" variant="secondary" onPress={() => onAddSet(exercise.exerciseId)} />
    </WorkoutCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '800',
  },
  muscleLabel: {
    marginTop: 2,
    color: Colors.lightGray,
    fontSize: 12,
    fontWeight: '700',
  },
  setHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setHeader: {
    color: Colors.lightGray,
    fontSize: 12,
    fontWeight: '600',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setIndex: {
    width: 36,
  },
  setIndexValue: {
    width: 36,
    color: Colors.white,
    textAlign: 'center',
    fontWeight: '700',
  },
  setField: {
    flex: 1,
  },
  setInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: Colors.inputBackground,
    color: Colors.white,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  deleteSlot: {
    width: 26,
    alignItems: 'center',
  },
});
