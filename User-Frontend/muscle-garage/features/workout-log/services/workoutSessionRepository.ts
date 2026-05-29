import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutSession } from '@/features/workout-log/types';

const STORAGE_KEY_PREFIX = 'mg_workout_sessions_v1';

const getStorageKey = (userId: string) => `${STORAGE_KEY_PREFIX}_${userId}`;

export interface WorkoutSessionRepository {
  listSessions(userId: string): Promise<WorkoutSession[]>;
  saveSession(userId: string, session: WorkoutSession): Promise<void>;
  updateSession(userId: string, session: WorkoutSession): Promise<void>;
  deleteSession(userId: string, sessionId: string): Promise<void>;
}

class AsyncStorageWorkoutSessionRepository implements WorkoutSessionRepository {
  async listSessions(userId: string): Promise<WorkoutSession[]> {
    const raw = await AsyncStorage.getItem(getStorageKey(userId));

    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as WorkoutSession[];
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed;
    } catch {
      return [];
    }
  }

  async saveSession(userId: string, session: WorkoutSession): Promise<void> {
    const current = await this.listSessions(userId);
    const updated = [session, ...current];
    await AsyncStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
  }

  async updateSession(userId: string, session: WorkoutSession): Promise<void> {
    const current = await this.listSessions(userId);
    const updated = current.map((entry) => (entry.id === session.id ? session : entry));
    await AsyncStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
  }

  async deleteSession(userId: string, sessionId: string): Promise<void> {
    const current = await this.listSessions(userId);
    const updated = current.filter((entry) => entry.id !== sessionId);
    await AsyncStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
  }
}

export const workoutSessionRepository: WorkoutSessionRepository =
  new AsyncStorageWorkoutSessionRepository();
