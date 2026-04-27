import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { WorkoutButton } from '@/features/workout-log/components/WorkoutButton';
import { exerciseService } from '@/features/workout-log/services/exerciseService';
import { ExerciseDefinition, MuscleGroup } from '@/features/workout-log/types';

type ExercisePickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onContinue: (selectedExercises: ExerciseDefinition[]) => void;
};

const FILTERS: Array<{ label: string; value: MuscleGroup | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Chest', value: 'chest' },
  { label: 'Back', value: 'back' },
  { label: 'Legs', value: 'legs' },
  { label: 'Arms', value: 'arms' },
  { label: 'Shoulders', value: 'shoulders' },
  { label: 'Core', value: 'core' },
];

export function ExercisePickerModal({ visible, onClose, onContinue }: ExercisePickerModalProps) {
  const [search, setSearch] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | 'all'>('all');
  const [exercises, setExercises] = useState<ExerciseDefinition[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const fetchExercises = async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await exerciseService.getExercises({ search, muscleGroup });
        setExercises(list);
      } catch {
        setError('Unable to load exercises. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, [visible, search, muscleGroup]);

  const selectedExercises = useMemo(
    () => exercises.filter((exercise) => selectedIds.has(exercise.id)),
    [exercises, selectedIds]
  );

  const toggleSelect = (exerciseId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }
      return next;
    });
  };

  const resetPickerState = () => {
    setSelectedIds(new Set());
    setSearch('');
    setMuscleGroup('all');
  };

  const handleContinue = () => {
    if (selectedExercises.length === 0) {
      return;
    }
    onContinue(selectedExercises);
    resetPickerState();
    onClose();
  };

  const renderExercise = ({ item }: { item: ExerciseDefinition }) => {
    const selected = selectedIds.has(item.id);

    return (
      <TouchableOpacity style={[styles.exerciseRow, selected && styles.exerciseSelected]} onPress={() => toggleSelect(item.id)}>
        <View style={styles.exerciseTextWrap}>
          <Text style={styles.exerciseName}>{item.name}</Text>
          <Text style={styles.exerciseMeta}>
            {item.muscleGroup.toUpperCase()} {item.equipment ? `• ${item.equipment}` : ''}
          </Text>
        </View>
        <Ionicons
          name={selected ? 'checkmark-circle' : 'ellipse-outline'}
          size={22}
          color={selected ? Colors.primary : Colors.lightGray}
        />
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Add Exercises</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <TextInput
            value={search}
            onChangeText={setSearch}
            style={styles.search}
            placeholder="Search exercises"
            placeholderTextColor={Colors.darkGray}
          />

          <View style={styles.filtersWrap}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={FILTERS}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const active = item.value === muscleGroup;
                return (
                  <TouchableOpacity
                    style={[styles.filterPill, active && styles.filterPillActive]}
                    onPress={() => setMuscleGroup(item.value)}
                  >
                    <Text style={[styles.filterText, active && styles.filterTextActive]}>{item.label}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          {loading ? (
            <View style={styles.centerWrap}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : error ? (
            <View style={styles.centerWrap}>
              <Text style={styles.errorText}>{error}</Text>
              <WorkoutButton label="Retry" onPress={() => setSearch((current) => current)} variant="secondary" />
            </View>
          ) : (
            <FlatList
              data={exercises}
              keyExtractor={(item) => item.id}
              renderItem={renderExercise}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={<Text style={styles.emptyList}>No exercises found for this filter.</Text>}
            />
          )}

          <WorkoutButton
            label={`Continue (${selectedIds.size})`}
            onPress={handleContinue}
            disabled={selectedIds.size === 0}
            style={styles.continueButton}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    minHeight: '72%',
    maxHeight: '90%',
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  handle: {
    alignSelf: 'center',
    width: 52,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '800',
  },
  search: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: Colors.inputBackground,
    color: Colors.white,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  filtersWrap: {
    marginBottom: 8,
  },
  filterPill: {
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 12,
    justifyContent: 'center',
    marginRight: 8,
  },
  filterPillActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255,165,0,0.15)',
  },
  filterText: {
    color: Colors.lightGray,
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: Colors.primary,
  },
  listContent: {
    paddingBottom: 8,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
    padding: 12,
    marginTop: 10,
  },
  exerciseSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255,165,0,0.08)',
  },
  exerciseTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  exerciseName: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  exerciseMeta: {
    marginTop: 2,
    color: Colors.lightGray,
    fontSize: 12,
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  emptyList: {
    marginTop: 24,
    textAlign: 'center',
    color: Colors.lightGray,
  },
  continueButton: {
    marginTop: 12,
  },
});
