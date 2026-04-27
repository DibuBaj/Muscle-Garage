import { ExerciseDefinition, ExerciseQuery } from '@/features/workout-log/types';

const WGER_EXERCISEINFO_ENDPOINT = 'https://wger.de/api/v2/exerciseinfo/';
const PAGE_SIZE = 200;
const MAX_PAGES = 4;
const ENGLISH_LANGUAGE_ID = 2;

const GROUP_NAMES = {
  chest: [
    'Barbell Bench Press',
    'Dumbbell Bench Press',
    'Incline Bench Press',
    'Decline Bench Press',
    'Incline Dumbbell Press',
    'Cable Fly',
    'Pec Deck Fly',
    'Push Up',
    'Weighted Push Up',
    'Close Grip Push Up',
    'Chest Dip',
    'Machine Chest Press',
    'Single Arm Cable Press',
    'Svend Press',
    'Landmine Press',
  ],
  back: [
    'Pull Up',
    'Chin Up',
    'Lat Pulldown',
    'Wide Grip Lat Pulldown',
    'Close Grip Pulldown',
    'Barbell Row',
    'Pendlay Row',
    'Seated Cable Row',
    'One Arm Dumbbell Row',
    'T-Bar Row',
    'Straight Arm Pulldown',
    'Face Pull',
    'Deadlift',
    'Rack Pull',
    'Meadows Row',
  ],
  legs: [
    'Back Squat',
    'Front Squat',
    'Box Squat',
    'Bulgarian Split Squat',
    'Walking Lunge',
    'Reverse Lunge',
    'Leg Press',
    'Hack Squat',
    'Romanian Deadlift',
    'Stiff Leg Deadlift',
    'Hip Thrust',
    'Leg Extension',
    'Lying Leg Curl',
    'Seated Leg Curl',
    'Standing Calf Raise',
    'Seated Calf Raise',
  ],
  arms: [
    'Barbell Curl',
    'EZ Bar Curl',
    'Dumbbell Curl',
    'Incline Dumbbell Curl',
    'Hammer Curl',
    'Preacher Curl',
    'Concentration Curl',
    'Cable Curl',
    'Triceps Pushdown',
    'Overhead Triceps Extension',
    'Skull Crusher',
    'Bench Dip',
    'Rope Pushdown',
    'Close Grip Bench Press',
    'Diamond Push Up',
  ],
  shoulders: [
    'Overhead Press',
    'Seated Dumbbell Press',
    'Arnold Press',
    'Push Press',
    'Lateral Raise',
    'Cable Lateral Raise',
    'Rear Delt Fly',
    'Reverse Pec Deck',
    'Upright Row',
    'Front Raise',
    'Lean Away Lateral Raise',
    'Snatch Grip High Pull',
  ],
  core: [
    'Plank',
    'Side Plank',
    'Dead Bug',
    'Hollow Body Hold',
    'Ab Wheel Rollout',
    'Hanging Leg Raise',
    'Knee Raise',
    'Cable Crunch',
    'Russian Twist',
    'Bicycle Crunch',
    'Mountain Climber',
    'Pallof Press',
  ],
} as const;

const MOCK_EXERCISES: ExerciseDefinition[] = Object.entries(GROUP_NAMES).flatMap(
  ([muscleGroup, names]) =>
    names.map((name) => ({
      id: `local-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name,
      muscleGroup: muscleGroup as ExerciseDefinition['muscleGroup'],
      equipment: undefined,
    }))
);

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
    equipment: item.equipment?.map((entry) => entry.name).filter(Boolean).join(', ') || undefined,
  };
};

const applyQuery = (catalog: ExerciseDefinition[], query?: ExerciseQuery): ExerciseDefinition[] => {
  const searchTerm = query?.search?.trim().toLowerCase() ?? '';
  const muscleGroup = query?.muscleGroup ?? 'all';

  return catalog.filter((exercise) => {
    const matchesSearch =
      searchTerm.length === 0 ||
      exercise.name.toLowerCase().includes(searchTerm) ||
      exercise.equipment?.toLowerCase().includes(searchTerm);

    const matchesMuscleGroup = muscleGroup === 'all' || exercise.muscleGroup === muscleGroup;

    return matchesSearch && matchesMuscleGroup;
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
    const catalog = await this.getCatalog();
    return applyQuery(catalog, query);
  }
}

export const exerciseService: ExerciseService = new MockExerciseService();
