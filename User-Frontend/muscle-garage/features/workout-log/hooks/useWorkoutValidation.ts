import { WorkoutSessionDraft } from '@/features/workout-log/types';

export function validateWorkoutDraft(draft: WorkoutSessionDraft): string[] {
  const errors: string[] = [];

  if (!draft.title.trim()) {
    errors.push('Workout session title is required.');
  }

  if (draft.exercises.length === 0) {
    errors.push('Add at least one exercise to continue.');
  }

  draft.exercises.forEach((exercise) => {
    if (exercise.sets.length === 0) {
      errors.push(`${exercise.name}: add at least one set.`);
      return;
    }

    exercise.sets.forEach((set, index) => {
      const weight = Number(set.weight);
      const reps = Number(set.reps);

      if (!set.weight.trim() || Number.isNaN(weight) || weight <= 0) {
        errors.push(`${exercise.name} - Set ${index + 1}: weight must be greater than 0.`);
      }

      if (!set.reps.trim() || Number.isNaN(reps) || reps <= 0) {
        errors.push(`${exercise.name} - Set ${index + 1}: reps must be greater than 0.`);
      }
    });
  });

  return errors;
}
