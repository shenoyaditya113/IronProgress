
export enum MuscleGroup {
  Chest = 'Chest',
  Back = 'Back',
  Legs = 'Legs',
  Shoulders = 'Shoulders',
  Arms = 'Arms',
  Core = 'Core'
}

export interface SetData {
  reps: number;
  weight: number;
}

export interface ExerciseEntry {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  sets: SetData[];
  date: string; // ISO string
  rating: number; // 1-5
}

export interface WorkoutSession {
  id: string;
  date: string;
  exercises: ExerciseEntry[];
  totalVolume: number;
  rating: number;
}

export interface HistoryItem {
  date: string;
  weight: number;
  reps: number;
  volume: number;
}
