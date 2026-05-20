export type MuscleGroup = 'chest' | 'back' | 'legs' | 'arms' | 'shoulders' | 'core';
export type ExerciseLevel = 'beginner' | 'intermediate' | 'advanced';

export interface ExerciseDefinition {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  level: ExerciseLevel;
  equipment?: string;
}

export interface WorkoutSet {
  id: string;
  weightKg: number;
  reps: number;
}

export interface WorkoutExercise {
  exerciseId: string;
  name: string;
  muscleGroup: MuscleGroup;
  sets: WorkoutSet[];
}

export interface WorkoutSession {
  id: string;
  title: string;
  createdAt: string;
  exercises: WorkoutExercise[];
}

export interface WorkoutSetDraft {
  id: string;
  weight: string;
  reps: string;
}

export interface WorkoutExerciseDraft {
  exerciseId: string;
  name: string;
  muscleGroup: MuscleGroup;
  sets: WorkoutSetDraft[];
}

export interface WorkoutSessionDraft {
  title: string;
  exercises: WorkoutExerciseDraft[];
}

export interface ExerciseQuery {
  search?: string;
  muscleGroup?: MuscleGroup | 'all';
  level?: ExerciseLevel | 'all';
}
