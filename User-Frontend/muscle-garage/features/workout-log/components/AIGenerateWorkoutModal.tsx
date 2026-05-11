import React, { useMemo, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { WorkoutButton } from '@/features/workout-log/components/WorkoutButton';
import { MuscleGroup } from '@/features/workout-log/types';

const GOAL_OPTIONS = [
  'Weight Loss',
  'Muscle Gain',
  'Maintenance',
  'Strength',
  'Endurance',
];

const EXPERIENCE_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];

const MUSCLE_OPTIONS: Array<{ label: string; value: MuscleGroup }> = [
  { label: 'Chest', value: 'chest' },
  { label: 'Back', value: 'back' },
  { label: 'Legs', value: 'legs' },
  { label: 'Arms', value: 'arms' },
  { label: 'Shoulders', value: 'shoulders' },
  { label: 'Core', value: 'core' },
];

export type AIGenerateFormValues = {
  age: string;
  weight: string;
  goal: string;
  experience: string;
  muscleGroups: MuscleGroup[];
};

type AIGenerateWorkoutModalProps = {
  visible: boolean;
  loading: boolean;
  initialAge?: string;
  initialWeight?: string;
  onClose: () => void;
  onSubmit: (values: AIGenerateFormValues) => void;
};

export function AIGenerateWorkoutModal({
  visible,
  loading,
  initialAge,
  initialWeight,
  onClose,
  onSubmit,
}: AIGenerateWorkoutModalProps) {
  const [age, setAge] = useState(initialAge ?? '');
  const [weight, setWeight] = useState(initialWeight ?? '');
  const [goal, setGoal] = useState('');
  const [experience, setExperience] = useState('');
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [error, setError] = useState('');

  const canSubmit = useMemo(
    () => goal.trim().length > 0 && experience.trim().length > 0 && muscleGroups.length > 0,
    [goal, experience, muscleGroups]
  );

  const handleToggleGroup = (group: MuscleGroup) => {
    setMuscleGroups((prev) => {
      if (prev.includes(group)) {
        return prev.filter((item) => item !== group);
      }
      return [...prev, group];
    });
  };

  const handleSubmit = () => {
    const ageNum = Number(age);
    const weightNum = Number(weight);

    if (age.trim() && (Number.isNaN(ageNum) || ageNum < 12 || ageNum > 100)) {
      setError('Age must be between 12 and 100.');
      return;
    }

    if (weight.trim() && (Number.isNaN(weightNum) || weightNum <= 0 || weightNum > 350)) {
      setError('Weight must be between 1 and 350 kg.');
      return;
    }

    if (!goal.trim()) {
      setError('Please select a goal.');
      return;
    }

    if (!experience.trim()) {
      setError('Please select your experience level.');
      return;
    }

    if (muscleGroups.length === 0) {
      setError('Please choose at least one muscle category.');
      return;
    }

    setError('');
    onSubmit({ age: age.trim(), weight: weight.trim(), goal: goal.trim(), experience: experience.trim(), muscleGroups });
  };

  const handleClose = () => {
    setError('');
    setAge(initialAge ?? '');
    setWeight(initialWeight ?? '');
    setGoal('');
    setExperience('');
    setMuscleGroups([]);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>AI Generate</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
                placeholder="e.g. 24"
                placeholderTextColor={Colors.darkGray}
                style={styles.input}
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                placeholder="e.g. 72"
                placeholderTextColor={Colors.darkGray}
                style={styles.input}
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Goal</Text>
              <View style={styles.groupWrap}>
                {GOAL_OPTIONS.map((item) => {
                  const active = goal === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.pill, active && styles.pillActive]}
                      onPress={() => setGoal(item)}
                    >
                      <Text style={[styles.pillText, active && styles.pillTextActive]}>{item}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Experience Level</Text>
              <View style={styles.groupWrap}>
                {EXPERIENCE_OPTIONS.map((item) => {
                  const active = experience === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.pill, active && styles.pillActive]}
                      onPress={() => setExperience(item)}
                    >
                      <Text style={[styles.pillText, active && styles.pillTextActive]}>{item}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Exercise Muscle Categories</Text>
              <View style={styles.groupWrap}>
                {MUSCLE_OPTIONS.map((item) => {
                  const active = muscleGroups.includes(item.value);
                  return (
                    <TouchableOpacity
                      key={item.value}
                      style={[styles.pill, active && styles.pillActive]}
                      onPress={() => handleToggleGroup(item.value)}
                    >
                      <Text style={[styles.pillText, active && styles.pillTextActive]}>{item.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <WorkoutButton
              label="Generate Workout"
              onPress={handleSubmit}
              loading={loading}
              disabled={!canSubmit || loading}
              style={styles.submitButton}
            />
          </ScrollView>
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
    minHeight: '74%',
    maxHeight: '92%',
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
  content: {
    gap: 14,
    paddingBottom: 12,
  },
  fieldWrap: {
    gap: 8,
  },
  label: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: Colors.inputBackground,
    color: Colors.white,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  groupWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 32,
    justifyContent: 'center',
  },
  pillActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255,165,0,0.16)',
  },
  pillText: {
    color: Colors.lightGray,
    fontSize: 12,
    fontWeight: '600',
  },
  pillTextActive: {
    color: Colors.primary,
  },
  errorText: {
    color: '#ff8a8a',
    fontSize: 13,
  },
  submitButton: {
    marginTop: 8,
  },
});
