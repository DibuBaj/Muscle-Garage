import { useEffect, useMemo, useState } from 'react';
import {
  ExerciseDefinition,
  WorkoutExerciseDraft,
  WorkoutSessionDraft,
  WorkoutSetDraft,
} from '@/features/workout-log/types';

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const createDefaultSet = (): WorkoutSetDraft => ({
  id: createId(),
  weight: '',
  reps: '',
});

export function useWorkoutSessionBuilder(initialDraft?: WorkoutSessionDraft) {
  const [title, setTitle] = useState(initialDraft?.title ?? '');
  const [exercises, setExercises] = useState<WorkoutExerciseDraft[]>(initialDraft?.exercises ?? []);

  useEffect(() => {
    if (!initialDraft) {
      return;
    }

    setTitle(initialDraft.title);
    setExercises(initialDraft.exercises);
  }, [initialDraft]);

  const addExercises = (incomingExercises: ExerciseDefinition[]) => {
    setExercises((prev) => {
      const existingIds = new Set(prev.map((item) => item.exerciseId));
      const nextItems = incomingExercises
        .filter((exercise) => !existingIds.has(exercise.id))
        .map((exercise) => ({
          exerciseId: exercise.id,
          name: exercise.name,
          muscleGroup: exercise.muscleGroup,
          sets: [createDefaultSet()],
        }));

      return [...prev, ...nextItems];
    });
  };

  const removeExercise = (exerciseId: string) => {
    setExercises((prev) => prev.filter((item) => item.exerciseId !== exerciseId));
  };

  const addSet = (exerciseId: string) => {
    setExercises((prev) =>
      prev.map((exercise) =>
        exercise.exerciseId === exerciseId
          ? { ...exercise, sets: [...exercise.sets, createDefaultSet()] }
          : exercise
      )
    );
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setExercises((prev) =>
      prev.map((exercise) => {
        if (exercise.exerciseId !== exerciseId) {
          return exercise;
        }

        return {
          ...exercise,
          sets: exercise.sets.filter((set) => set.id !== setId),
        };
      })
    );
  };

  const updateSet = (
    exerciseId: string,
    setId: string,
    field: 'weight' | 'reps',
    value: string
  ) => {
    setExercises((prev) =>
      prev.map((exercise) => {
        if (exercise.exerciseId !== exerciseId) {
          return exercise;
        }

        return {
          ...exercise,
          sets: exercise.sets.map((set) => (set.id === setId ? { ...set, [field]: value } : set)),
        };
      })
    );
  };

  const draft: WorkoutSessionDraft = useMemo(
    () => ({
      title,
      exercises,
    }),
    [title, exercises]
  );

  const reset = () => {
    setTitle('');
    setExercises([]);
  };

  const hydrate = (draftValue: WorkoutSessionDraft) => {
    setTitle(draftValue.title);
    setExercises(draftValue.exercises);
  };

  return {
    title,
    exercises,
    setTitle,
    addExercises,
    removeExercise,
    addSet,
    removeSet,
    updateSet,
    draft,
    reset,
    hydrate,
  };
}
