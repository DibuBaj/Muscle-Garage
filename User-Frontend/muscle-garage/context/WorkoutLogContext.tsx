import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { WorkoutSession, WorkoutSessionDraft } from '@/features/workout-log/types';
import { workoutSessionRepository } from '@/features/workout-log/services/workoutSessionRepository';
import { useAuth } from '@/context/AuthContext';

type WorkoutLogState = {
  sessions: WorkoutSession[];
  loading: boolean;
  error: string | null;
};

type WorkoutLogContextType = WorkoutLogState & {
  createWorkoutSession: (draft: WorkoutSessionDraft) => Promise<void>;
  updateWorkoutSession: (sessionId: string, draft: WorkoutSessionDraft) => Promise<void>;
  deleteWorkoutSession: (sessionId: string) => Promise<void>;
  refreshSessions: () => Promise<void>;
  clearError: () => void;
};

type Action =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; payload: WorkoutSession[] }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'ADD_SESSION'; payload: WorkoutSession }
  | { type: 'UPDATE_SESSION'; payload: WorkoutSession }
  | { type: 'DELETE_SESSION'; payload: string }
  | { type: 'CLEAR_ERROR' };

const initialState: WorkoutLogState = {
  sessions: [],
  loading: false,
  error: null,
};

const WorkoutLogContext = createContext<WorkoutLogContextType | null>(null);

function reducer(state: WorkoutLogState, action: Action): WorkoutLogState {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, loading: true, error: null };
    case 'LOAD_SUCCESS':
      return { ...state, loading: false, sessions: action.payload, error: null };
    case 'SET_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'ADD_SESSION':
      return { ...state, sessions: [action.payload, ...state.sessions], error: null };
    case 'UPDATE_SESSION':
      return {
        ...state,
        sessions: state.sessions.map((session) =>
          session.id === action.payload.id ? action.payload : session
        ),
        error: null,
      };
    case 'DELETE_SESSION':
      return {
        ...state,
        sessions: state.sessions.filter((session) => session.id !== action.payload),
        error: null,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

function transformDraft(draft: WorkoutSessionDraft): WorkoutSession {
  return {
    id: createId(),
    title: draft.title.trim(),
    createdAt: new Date().toISOString(),
    exercises: draft.exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      sets: exercise.sets.map((set) => ({
        id: createId(),
        weightKg: Number(set.weight),
        reps: Number(set.reps),
      })),
    })),
  };
}

function transformDraftForUpdate(existing: WorkoutSession, draft: WorkoutSessionDraft): WorkoutSession {
  return {
    id: existing.id,
    createdAt: existing.createdAt,
    title: draft.title.trim(),
    exercises: draft.exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      sets: exercise.sets.map((set) => ({
        id: set.id || createId(),
        weightKg: Number(set.weight),
        reps: Number(set.reps),
      })),
    })),
  };
}

export function WorkoutLogProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { user } = useAuth();

  const refreshSessions = async () => {
    dispatch({ type: 'LOAD_START' });

    if (!user?.id) {
      dispatch({ type: 'LOAD_SUCCESS', payload: [] });
      return;
    }

    try {
      const sessions = await workoutSessionRepository.listSessions(user.id);
      dispatch({ type: 'LOAD_SUCCESS', payload: sessions });
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load workout sessions.' });
    }
  };

  const createWorkoutSession = async (draft: WorkoutSessionDraft) => {
    if (!user?.id) {
      dispatch({ type: 'SET_ERROR', payload: 'You must be logged in to save workout sessions.' });
      throw new Error('You must be logged in to save workout sessions.');
    }

    try {
      const session = transformDraft(draft);
      await workoutSessionRepository.saveSession(user.id, session);
      dispatch({ type: 'ADD_SESSION', payload: session });
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save workout session.' });
      throw new Error('Failed to save workout session.');
    }
  };

  const updateWorkoutSession = async (sessionId: string, draft: WorkoutSessionDraft) => {
    if (!user?.id) {
      dispatch({ type: 'SET_ERROR', payload: 'You must be logged in to update workout sessions.' });
      throw new Error('You must be logged in to update workout sessions.');
    }

    try {
      const existing = state.sessions.find((entry) => entry.id === sessionId);
      if (!existing) {
        throw new Error('Session not found');
      }

      const updatedSession = transformDraftForUpdate(existing, draft);
      await workoutSessionRepository.updateSession(user.id, updatedSession);
      dispatch({ type: 'UPDATE_SESSION', payload: updatedSession });
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update workout session.' });
      throw new Error('Failed to update workout session.');
    }
  };

  const deleteWorkoutSession = async (sessionId: string) => {
    if (!user?.id) {
      dispatch({ type: 'SET_ERROR', payload: 'You must be logged in to delete workout sessions.' });
      throw new Error('You must be logged in to delete workout sessions.');
    }

    try {
      await workoutSessionRepository.deleteSession(user.id, sessionId);
      dispatch({ type: 'DELETE_SESSION', payload: sessionId });
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete workout session.' });
      throw new Error('Failed to delete workout session.');
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  useEffect(() => {
    refreshSessions();
  }, [user?.id]);

  const value = useMemo(
    () => ({
      sessions: state.sessions,
      loading: state.loading,
      error: state.error,
      createWorkoutSession,
      updateWorkoutSession,
      deleteWorkoutSession,
      refreshSessions,
      clearError,
    }),
    [state.sessions, state.loading, state.error, user?.id]
  );

  return <WorkoutLogContext.Provider value={value}>{children}</WorkoutLogContext.Provider>;
}

export function useWorkoutLog() {
  const context = useContext(WorkoutLogContext);
  if (!context) {
    throw new Error('useWorkoutLog must be used within WorkoutLogProvider');
  }

  return context;
}
