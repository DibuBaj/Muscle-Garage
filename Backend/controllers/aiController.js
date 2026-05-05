const { GoogleGenerativeAI } = require('@google/generative-ai');

const MUSCLE_GROUPS = ['chest', 'back', 'legs', 'arms', 'shoulders', 'core'];

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const sanitizeJsonText = (text) => text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();

const normalizeGoal = (goal) => (goal || '').toLowerCase();

const baseWeightFromGoal = (weight, goal) => {
  const g = normalizeGoal(goal);

  if (!weight || Number.isNaN(weight)) {
    if (g.includes('loss')) return 12;
    if (g.includes('maint')) return 18;
    return 22;
  }

  if (g.includes('loss')) return Math.max(8, Math.round(weight * 0.25));
  if (g.includes('maint')) return Math.max(10, Math.round(weight * 0.35));
  return Math.max(12, Math.round(weight * 0.45));
};

const repsRangeFromGoal = (goal) => {
  const g = normalizeGoal(goal);
  if (g.includes('loss')) return { min: 12, max: 15 };
  if (g.includes('maint')) return { min: 8, max: 12 };
  return { min: 6, max: 10 };
};

const generateFallbackDraft = ({ age, weight, goal, availableExercises }) => {
  const picked = availableExercises.slice(0, 6);
  const baseWeight = baseWeightFromGoal(Number(weight), goal);
  const repsRange = repsRangeFromGoal(goal);
  const ageLabel = age ? `Age ${age}` : 'Custom';

  return {
    title: `${goal || 'AI'} Session (${ageLabel})`,
    exercises: picked.map((exercise, index) => {
      const workingWeight = Math.max(5, baseWeight + index * 2);

      return {
        exerciseId: exercise.id,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        sets: [0, 1, 2].map((setIndex) => ({
          id: createId(),
          reps: String(Math.max(repsRange.min, repsRange.max - setIndex)),
          weight: String(Math.max(5, workingWeight - setIndex * 2)),
        })),
      };
    }),
  };
};

const buildPrompt = ({ age, weight, goal, muscleGroups, allowedExercises }) => {
  const exerciseCatalog = allowedExercises
    .map((exercise) => `- id: ${exercise.id} | name: ${exercise.name} | group: ${exercise.muscleGroup}`)
    .join('\n');

  return `You are a workout planning assistant.
Create one safe beginner-intermediate workout session using ONLY the allowed exercises.

User profile:
- age: ${age || 'unknown'}
- weightKg: ${weight || 'unknown'}
- goal: ${goal}
- target muscle groups: ${muscleGroups.join(', ')}

Rules:
1) Use ONLY exercise IDs from the allowed list.
2) Return 4 to 8 exercises.
3) Each exercise must have 3 or 4 sets.
4) Reps and weightKg must be positive integers.
5) weightKg should be realistic for a gym user.
6) Output STRICT JSON only, no markdown.

Return this shape:
{
  "title": "string",
  "exercises": [
    {
      "exerciseId": "string",
      "sets": [{"reps": 10, "weightKg": 20}]
    }
  ]
}

Allowed exercises:
${exerciseCatalog}`;
};

const parseAiResponseToDraft = (rawText, allowedExerciseMap) => {
  const cleaned = sanitizeJsonText(rawText);
  const parsed = JSON.parse(cleaned);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid AI response format');
  }

  if (!Array.isArray(parsed.exercises) || parsed.exercises.length === 0) {
    throw new Error('AI returned no exercises');
  }

  const seen = new Set();
  const normalizedExercises = [];

  for (const item of parsed.exercises) {
    const exerciseId = String(item.exerciseId || '').trim();
    if (!exerciseId || !allowedExerciseMap.has(exerciseId) || seen.has(exerciseId)) {
      continue;
    }

    const sourceExercise = allowedExerciseMap.get(exerciseId);
    const sets = Array.isArray(item.sets) ? item.sets : [];
    const normalizedSets = sets
      .map((set) => ({
        id: createId(),
        reps: String(Math.max(1, Math.round(Number(set.reps) || 0))),
        weight: String(Math.max(1, Math.round(Number(set.weightKg) || 0))),
      }))
      .filter((set) => Number(set.reps) > 0 && Number(set.weight) > 0);

    if (normalizedSets.length === 0) {
      continue;
    }

    seen.add(exerciseId);
    normalizedExercises.push({
      exerciseId,
      name: sourceExercise.name,
      muscleGroup: sourceExercise.muscleGroup,
      sets: normalizedSets.slice(0, 4),
    });
  }

  if (normalizedExercises.length === 0) {
    throw new Error('AI response did not contain allowed exercises');
  }

  return {
    title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : 'AI Generated Workout',
    exercises: normalizedExercises.slice(0, 8),
  };
};

const validateRequest = ({ age, weight, goal, muscleGroups, availableExercises }) => {
  const errors = [];

  if (!goal || typeof goal !== 'string' || !goal.trim()) {
    errors.push('Goal is required.');
  }

  const ageNumber = Number(age);
  if (age !== undefined && age !== null && age !== '' && (Number.isNaN(ageNumber) || ageNumber < 12 || ageNumber > 100)) {
    errors.push('Age must be between 12 and 100.');
  }

  const weightNumber = Number(weight);
  if (weight !== undefined && weight !== null && weight !== '' && (Number.isNaN(weightNumber) || weightNumber <= 0 || weightNumber > 350)) {
    errors.push('Weight must be between 1 and 350 kg.');
  }

  if (!Array.isArray(muscleGroups) || muscleGroups.length === 0) {
    errors.push('Select at least one muscle group.');
  }

  if (!Array.isArray(availableExercises) || availableExercises.length === 0) {
    errors.push('No available exercises were provided.');
  }

  return errors;
};

exports.generateWorkoutSession = async (req, res) => {
  const { age, weight, goal, muscleGroups, availableExercises } = req.body || {};
  const errors = validateRequest({ age, weight, goal, muscleGroups, availableExercises });

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors,
    });
  }

  const normalizedMuscleGroups = muscleGroups
    .map((group) => String(group).toLowerCase().trim())
    .filter((group) => MUSCLE_GROUPS.includes(group));

  if (normalizedMuscleGroups.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Selected muscle groups are invalid.',
    });
  }

  const allowedExercises = availableExercises.filter((exercise) => {
    const group = String(exercise?.muscleGroup || '').toLowerCase();
    return exercise?.id && exercise?.name && normalizedMuscleGroups.includes(group);
  });

  if (allowedExercises.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No exercises available for selected muscle groups.',
    });
  }

  const allowedExerciseMap = new Map(
    allowedExercises.map((exercise) => [String(exercise.id), {
      id: String(exercise.id),
      name: String(exercise.name),
      muscleGroup: String(exercise.muscleGroup).toLowerCase(),
    }])
  );

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    const fallbackDraft = generateFallbackDraft({ age, weight, goal, availableExercises: allowedExercises });
    return res.json({
      success: true,
      source: 'fallback',
      draft: fallbackDraft,
      message: 'GEMINI_API_KEY missing. Returned fallback workout.',
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = buildPrompt({
      age,
      weight,
      goal,
      muscleGroups: normalizedMuscleGroups,
      allowedExercises,
    });

    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.() ?? '';

    const draft = parseAiResponseToDraft(text, allowedExerciseMap);

    return res.json({
      success: true,
      source: 'ai',
      draft,
    });
  } catch (error) {
    console.error('AI generation failed:', error.message);
    const fallbackDraft = generateFallbackDraft({ age, weight, goal, availableExercises: allowedExercises });

    return res.json({
      success: true,
      source: 'fallback',
      draft: fallbackDraft,
      message: 'AI generation failed. Returned fallback workout.',
    });
  }
};
