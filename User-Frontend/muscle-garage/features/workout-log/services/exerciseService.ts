import { ExerciseDefinition, ExerciseLevel, ExerciseQuery } from '@/features/workout-log/types';

const WGER_EXERCISEINFO_ENDPOINT = 'https://wger.de/api/v2/exerciseinfo/';
const PAGE_SIZE = 200;
const MAX_PAGES = 4;
const ENGLISH_LANGUAGE_ID = 2;

const GROUP_EXERCISES: Record<ExerciseDefinition['muscleGroup'], Array<{ name: string; level: ExerciseLevel }>> = {
  chest: [
    { name: 'Push Up', level: 'beginner' },
    { name: 'Machine Chest Press', level: 'beginner' },
    { name: 'Dumbbell Bench Press', level: 'beginner' },
    { name: 'Incline Dumbbell Press', level: 'beginner' },
    { name: 'Barbell Bench Press', level: 'intermediate' },
    { name: 'Incline Bench Press', level: 'intermediate' },
    { name: 'Cable Fly', level: 'intermediate' },
    { name: 'Pec Deck Fly', level: 'intermediate' },
    { name: 'Decline Bench Press', level: 'advanced' },
    { name: 'Weighted Push Up', level: 'advanced' },
    { name: 'Chest Dip', level: 'advanced' },
    { name: 'Single Arm Cable Press', level: 'advanced' },
    { name: 'Svend Press', level: 'advanced' },
    { name: 'Landmine Press', level: 'advanced' },
  ],
  back: [
    { name: 'Lat Pulldown', level: 'beginner' },
    { name: 'Close Grip Pulldown', level: 'beginner' },
    { name: 'Seated Cable Row', level: 'beginner' },
    { name: 'One Arm Dumbbell Row', level: 'beginner' },
    { name: 'Face Pull', level: 'beginner' },
    { name: 'Pull Up', level: 'intermediate' },
    { name: 'Chin Up', level: 'intermediate' },
    { name: 'Barbell Row', level: 'intermediate' },
    { name: 'T-Bar Row', level: 'intermediate' },
    { name: 'Straight Arm Pulldown', level: 'intermediate' },
    { name: 'Wide Grip Lat Pulldown', level: 'advanced' },
    { name: 'Pendlay Row', level: 'advanced' },
    { name: 'Meadows Row', level: 'advanced' },
    { name: 'Deadlift', level: 'advanced' },
    { name: 'Rack Pull', level: 'advanced' },
  ],
  legs: [
    { name: 'Leg Press', level: 'beginner' },
    { name: 'Walking Lunge', level: 'beginner' },
    { name: 'Reverse Lunge', level: 'beginner' },
    { name: 'Leg Extension', level: 'beginner' },
    { name: 'Seated Leg Curl', level: 'beginner' },
    { name: 'Standing Calf Raise', level: 'beginner' },
    { name: 'Back Squat', level: 'intermediate' },
    { name: 'Front Squat', level: 'intermediate' },
    { name: 'Romanian Deadlift', level: 'intermediate' },
    { name: 'Hip Thrust', level: 'intermediate' },
    { name: 'Bulgarian Split Squat', level: 'intermediate' },
    { name: 'Lying Leg Curl', level: 'intermediate' },
    { name: 'Box Squat', level: 'advanced' },
    { name: 'Hack Squat', level: 'advanced' },
    { name: 'Stiff Leg Deadlift', level: 'advanced' },
    { name: 'Seated Calf Raise', level: 'advanced' },
  ],
  arms: [
    { name: 'Dumbbell Curl', level: 'beginner' },
    { name: 'Hammer Curl', level: 'beginner' },
    { name: 'Triceps Pushdown', level: 'beginner' },
    { name: 'Rope Pushdown', level: 'beginner' },
    { name: 'Bench Dip', level: 'beginner' },
    { name: 'Barbell Curl', level: 'intermediate' },
    { name: 'EZ Bar Curl', level: 'intermediate' },
    { name: 'Incline Dumbbell Curl', level: 'intermediate' },
    { name: 'Overhead Triceps Extension', level: 'intermediate' },
    { name: 'Skull Crusher', level: 'intermediate' },
    { name: 'Cable Curl', level: 'intermediate' },
    { name: 'Preacher Curl', level: 'advanced' },
    { name: 'Concentration Curl', level: 'advanced' },
    { name: 'Close Grip Bench Press', level: 'advanced' },
    { name: 'Diamond Push Up', level: 'advanced' },
  ],
  shoulders: [
    { name: 'Seated Dumbbell Press', level: 'beginner' },
    { name: 'Lateral Raise', level: 'beginner' },
    { name: 'Front Raise', level: 'beginner' },
    { name: 'Rear Delt Fly', level: 'beginner' },
    { name: 'Overhead Press', level: 'intermediate' },
    { name: 'Arnold Press', level: 'intermediate' },
    { name: 'Cable Lateral Raise', level: 'intermediate' },
    { name: 'Upright Row', level: 'intermediate' },
    { name: 'Reverse Pec Deck', level: 'intermediate' },
    { name: 'Push Press', level: 'advanced' },
    { name: 'Lean Away Lateral Raise', level: 'advanced' },
    { name: 'Snatch Grip High Pull', level: 'advanced' },
  ],
  core: [
    { name: 'Plank', level: 'beginner' },
    { name: 'Side Plank', level: 'beginner' },
    { name: 'Dead Bug', level: 'beginner' },
    { name: 'Bicycle Crunch', level: 'beginner' },
    { name: 'Mountain Climber', level: 'beginner' },
    { name: 'Cable Crunch', level: 'intermediate' },
    { name: 'Russian Twist', level: 'intermediate' },
    { name: 'Knee Raise', level: 'intermediate' },
    { name: 'Pallof Press', level: 'intermediate' },
    { name: 'Ab Wheel Rollout', level: 'advanced' },
    { name: 'Hanging Leg Raise', level: 'advanced' },
    { name: 'Hollow Body Hold', level: 'advanced' },
  ],
};

const MOCK_EXERCISES: ExerciseDefinition[] = Object.entries(GROUP_EXERCISES).flatMap(
  ([muscleGroup, entries]) =>
    entries.map(({ name, level }) => ({
      id: `local-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name,
      muscleGroup: muscleGroup as ExerciseDefinition['muscleGroup'],
      level,
      equipment: undefined,
    }))
);

const DEFAULT_WGER_LEVEL: ExerciseLevel = 'intermediate';

type WgerExerciseInfoResponse = {
  next: string | null;
  results: WgerExerciseInfo[];
};

type WgerExerciseInfo = {
  id: number;
  category?: { name?: string };
  muscles?: Array<{ name_en?: string; name?: string }>;
  muscles_secondary?: Array<{ name_en?: string; name?: string }>;
  equipment?: Array<{ name?: string }>;
  translations?: Array<{ language: number; name?: string }>;
};

const mapMuscleGroup = (rawValue?: string): ExerciseDefinition['muscleGroup'] => {
  const value = rawValue?.toLowerCase() ?? '';

  if (value.includes('chest') || value.includes('pector')) return 'chest';
  if (value.includes('back') || value.includes('lat') || value.includes('trap')) return 'back';
  if (value.includes('leg') || value.includes('glute') || value.includes('calf') || value.includes('quad') || value.includes('hamstring')) return 'legs';
  if (value.includes('arm') || value.includes('biceps') || value.includes('triceps') || value.includes('forearm')) return 'arms';
  if (value.includes('shoulder') || value.includes('deltoid')) return 'shoulders';

  return 'core';
};

const normalizeExercise = (item: WgerExerciseInfo): ExerciseDefinition | null => {
  const translationName = item.translations?.find((t) => t.language === ENGLISH_LANGUAGE_ID)?.name;
  const fallbackName = item.translations?.[0]?.name;
  const name = translationName?.trim() || fallbackName?.trim();

  if (!name) {
    return null;
  }

  const primaryMuscle = item.muscles?.[0]?.name_en || item.muscles?.[0]?.name;
  const secondaryMuscle = item.muscles_secondary?.[0]?.name_en || item.muscles_secondary?.[0]?.name;
  const categoryName = item.category?.name;
  const muscleGroup = mapMuscleGroup(primaryMuscle || secondaryMuscle || categoryName);

  return {
    id: `wger-${item.id}`,
    name,
    muscleGroup,
    level: DEFAULT_WGER_LEVEL,
    equipment: item.equipment?.map((entry) => entry.name).filter(Boolean).join(', ') || undefined,
  };
};

const applyQuery = (catalog: ExerciseDefinition[], query?: ExerciseQuery): ExerciseDefinition[] => {
  const searchTerm = query?.search?.trim().toLowerCase() ?? '';
  const muscleGroup = query?.muscleGroup ?? 'all';
  const level = query?.level ?? 'all';

  return catalog.filter((exercise) => {
    const matchesSearch =
      searchTerm.length === 0 ||
      exercise.name.toLowerCase().includes(searchTerm) ||
      exercise.equipment?.toLowerCase().includes(searchTerm);

    const matchesMuscleGroup = muscleGroup === 'all' || exercise.muscleGroup === muscleGroup;
    const matchesLevel = level === 'all' || exercise.level === level;

    return matchesSearch && matchesMuscleGroup && matchesLevel;
  });
};

export interface ExerciseService {
  getExercises(query?: ExerciseQuery): Promise<ExerciseDefinition[]>;
}

class MockExerciseService implements ExerciseService {
  private cachedCatalog: ExerciseDefinition[] | null = null;

  private async fetchWgerCatalog(): Promise<ExerciseDefinition[]> {
    const all: ExerciseDefinition[] = [];
    let nextUrl: string | null = `${WGER_EXERCISEINFO_ENDPOINT}?language=${ENGLISH_LANGUAGE_ID}&limit=${PAGE_SIZE}`;
    let page = 0;

    while (nextUrl && page < MAX_PAGES) {
      const response = await fetch(nextUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch exercise catalog');
      }

      const data = (await response.json()) as WgerExerciseInfoResponse;
      const normalized = data.results
        .map(normalizeExercise)
        .filter((item): item is ExerciseDefinition => Boolean(item));

      all.push(...normalized);
      nextUrl = data.next;
      page += 1;
    }

    if (all.length === 0) {
      throw new Error('Exercise catalog is empty');
    }

    // Remove duplicate names while preserving first-seen ordering.
    const uniqueByName = new Map<string, ExerciseDefinition>();
    all.forEach((exercise) => {
      const key = exercise.name.toLowerCase();
      if (!uniqueByName.has(key)) {
        uniqueByName.set(key, exercise);
      }
    });

    return Array.from(uniqueByName.values());
  }

  private async getCatalog(): Promise<ExerciseDefinition[]> {
    if (this.cachedCatalog) {
      return this.cachedCatalog;
    }

    try {
      this.cachedCatalog = await this.fetchWgerCatalog();
      return this.cachedCatalog;
    } catch {
      this.cachedCatalog = MOCK_EXERCISES;
      return this.cachedCatalog;
    }
  }

  async getExercises(query?: ExerciseQuery): Promise<ExerciseDefinition[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const useLevelCatalog = query?.level && query.level !== 'all';
    const catalog = useLevelCatalog ? MOCK_EXERCISES : await this.getCatalog();
    return applyQuery(catalog, query);
  }
}

export const exerciseService: ExerciseService = new MockExerciseService();
