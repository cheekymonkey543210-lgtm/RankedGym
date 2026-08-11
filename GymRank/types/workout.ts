export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Biceps'
  | 'Triceps'
  | 'Quads'
  | 'Hamstrings'
  | 'Glutes'
  | 'Calves'
  | 'Core';

export type SetData = {
  id: string;
  weight: string;
  reps: string;
  completed: boolean;
};

export type Exercise = {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  sets: SetData[];
};

export type ExerciseDefinition = {
  name: string;
  muscleGroup: MuscleGroup;
};

export type WorkoutState = {
  id: string;
  name: string;
  startedAt: number;
  updatedAt: number;
  exercises: Exercise[];
};
