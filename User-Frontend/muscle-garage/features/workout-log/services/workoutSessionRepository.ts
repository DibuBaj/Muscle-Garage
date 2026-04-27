import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutSession } from '@/features/workout-log/types';

const STORAGE_KEY = 'mg_workout_sessions_v1';

export interface WorkoutSessionRepository {
  listSessions(): Promise<WorkoutSession[]>;
  saveSession(session: WorkoutSession): Promise<void>;
  updateSession(session: WorkoutSession): Promise<void>;
  deleteSession(sessionId: string): Promise<void>;
}

class AsyncStorageWorkoutSessionRepository implements WorkoutSessionRepository {
  async listSessions(): Promise<WorkoutSession[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);

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

  async saveSession(session: WorkoutSession): Promise<void> {
    const current = await this.listSessions();
    const updated = [session, ...current];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  async updateSession(session: WorkoutSession): Promise<void> {
    const current = await this.listSessions();
    const updated = current.map((entry) => (entry.id === session.id ? session : entry));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  async deleteSession(sessionId: string): Promise<void> {
    const current = await this.listSessions();
    const updated = current.filter((entry) => entry.id !== sessionId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
}

export const workoutSessionRepository: WorkoutSessionRepository =
  new AsyncStorageWorkoutSessionRepository();
