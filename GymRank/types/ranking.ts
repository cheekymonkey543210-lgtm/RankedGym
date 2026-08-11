import type { MuscleGroup } from './workout';

export type RankTier =
  | 'Bronze'
  | 'Silver'
  | 'Gold'
  | 'Platinum'
  | 'Diamond'
  | 'Master'
  | 'Grandmaster'
  | 'Elite';

export type Rank = {
  tier: RankTier;
  division: number;
  rating: number;
};

export type RatingChange = {
  before: number;
  after: number;
  change: number;
  rankBefore: Rank;
  rankAfter: Rank;
  rankedUp: boolean;
};

export type LiftRating = {
  exerciseName: string;
  muscleGroup: MuscleGroup;
  rating: number;
  bestEstimated1RM: number;
  bestWeight: number;
  bestReps: number;
  totalVolume: number;
  workoutsTracked: number;
};

export type BodyPartRating = {
  muscleGroup: MuscleGroup;
  rating: number;
  workoutsTracked: number;
};

export type RankingState = {
  overallRating: number;
  bodyParts: Partial<Record<MuscleGroup, BodyPartRating>>;
  lifts: Record<string, LiftRating>;
  updatedAt: number;
};

