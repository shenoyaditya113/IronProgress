
import { WorkoutSession, ExerciseEntry, MuscleGroup } from './types';

const DB_KEY = 'iron_progress_sessions';

export const db = {
  getSessions: (): WorkoutSession[] => {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveSession: (session: WorkoutSession) => {
    const sessions = db.getSessions();
    localStorage.setItem(DB_KEY, JSON.stringify([...sessions, session]));
  },

  updateSession: (sessionId: string, updatedSession: WorkoutSession): boolean => {
    const sessions = db.getSessions();
    const idx = sessions.findIndex(s => s.id === sessionId);
    if (idx === -1) return false;
    sessions[idx] = updatedSession;
    localStorage.setItem(DB_KEY, JSON.stringify(sessions));
    return true;
  },

  deleteSession: (sessionId: string): boolean => {
    const sessions = db.getSessions();
    const next = sessions.filter(s => s.id !== sessionId);
    if (next.length === sessions.length) return false;
    localStorage.setItem(DB_KEY, JSON.stringify(next));
    return true;
  },

  getPreviousWorkoutForMuscle: (muscle: MuscleGroup): ExerciseEntry | null => {
    const sessions = db.getSessions().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    for (const session of sessions) {
      const exercise = session.exercises.find(e => e.muscleGroup === muscle);
      if (exercise) return exercise;
    }
    return null;
  },

  getExerciseHistory: (exerciseName: string): ExerciseEntry[] => {
    const sessions = db.getSessions();
    const history: ExerciseEntry[] = [];
    sessions.forEach(s => {
      s.exercises.forEach(e => {
        if (e.name === exerciseName) history.push(e);
      });
    });
    return history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
};
