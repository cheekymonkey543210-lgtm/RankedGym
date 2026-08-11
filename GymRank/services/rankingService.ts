import type {
  Exercise,
  MuscleGroup,
} from '../types/workout';

import type {
  BodyPartRating,
  LiftRating,
  Rank,
  RankTier,
  RankingState,
  RatingChange,
} from '../types/ranking';

export const STARTING_RATING = 1000;

const MIN_RATING = 0;

const TIER_THRESHOLDS: Array<{
  tier: RankTier;
  minimum: number;
}> = [
  {
    tier: 'Elite',
    minimum: 2400,
  },
  {
    tier: 'Grandmaster',
    minimum: 2200,
  },
  {
    tier: 'Master',
    minimum: 2000,
  },
  {
    tier: 'Diamond',
    minimum: 1800,
  },
  {
    tier: 'Platinum',
    minimum: 1600,
  },
  {
    tier: 'Gold',
    minimum: 1400,
  },
  {
    tier: 'Silver',
    minimum: 1200,
  },
  {
    tier: 'Bronze',
    minimum: 0,
  },
];

/**
 * Converts a numeric rating into a visible rank.
 */
export function getRank(
  rating: number
): Rank {
  const safeRating = Math.max(
    MIN_RATING,
    Math.round(rating)
  );

  const tier =
    TIER_THRESHOLDS.find(
      (item) =>
        safeRating >= item.minimum
    )?.tier ?? 'Bronze';

  const tierIndex =
    TIER_THRESHOLDS.findIndex(
      (item) => item.tier === tier
    );

  const tierMinimum =
    TIER_THRESHOLDS[tierIndex]?.minimum ?? 0;

  /*
   * Every tier currently spans 200 rating.
   *
   * Five divisions means:
   *
   * Division 5 → lowest
   * Division 1 → highest
   *
   * This can be rebalanced independently later.
   */
  const divisionSize = 40;

  const progress =
    safeRating - tierMinimum;

  const division =
    tier === 'Elite'
      ? 1
      : Math.min(
          5,
          Math.max(
            1,
            5 -
              Math.floor(
                progress /
                  divisionSize
              )
          )
        );

  return {
    tier,
    division,
    rating: safeRating,
  };
}

export function formatRank(
  rank: Rank
): string {
  if (
    rank.tier === 'Elite'
  ) {
    return 'Elite';
  }

  return `${rank.tier} ${rank.division}`;
}

/**
 * Epley estimated 1RM.
 */
export function calculateEstimated1RM(
  weight: number,
  reps: number
): number {
  if (
    !Number.isFinite(weight) ||
    !Number.isFinite(reps) ||
    weight <= 0 ||
    reps <= 0
  ) {
    return 0;
  }

  if (reps === 1) {
    return weight;
  }

  /*
   * E1RM becomes increasingly unreliable
   * at very high rep counts.
   */
  if (reps > 15) {
    return weight;
  }

  return weight * (1 + reps / 30);
}

export function calculateSetVolume(
  weight: number,
  reps: number
): number {
  if (
    !Number.isFinite(weight) ||
    !Number.isFinite(reps) ||
    weight <= 0 ||
    reps <= 0
  ) {
    return 0;
  }

  return weight * reps;
}

/**
 * Calculates the strongest performance
 * recorded for an exercise in a workout.
 */
export function calculateExercisePerformance(
  exercise: Exercise
) {
  let totalVolume = 0;
  let bestEstimated1RM = 0;
  let bestWeight = 0;
  let bestReps = 0;

  for (const set of exercise.sets) {
    if (!set.completed) {
      continue;
    }

    const weight =
      Number.parseFloat(set.weight);

    const reps =
      Number.parseInt(set.reps, 10);

    if (
      !Number.isFinite(weight) ||
      !Number.isFinite(reps) ||
      weight <= 0 ||
      reps <= 0
    ) {
      continue;
    }

    totalVolume +=
      calculateSetVolume(
        weight,
        reps
      );

    const estimated1RM =
      calculateEstimated1RM(
        weight,
        reps
      );

    if (
      estimated1RM >
      bestEstimated1RM
    ) {
      bestEstimated1RM =
        estimated1RM;

      bestWeight = weight;
      bestReps = reps;
    }
  }

  return {
    totalVolume,
    bestEstimated1RM,
    bestWeight,
    bestReps,
  };
}

/**
 * Calculates the rating gained from one
 * exercise during the completed workout.
 *
 * This is deliberately conservative for V1.
 */
export function calculateExerciseRatingGain(
  exercise: Exercise
): number {
  const performance =
    calculateExercisePerformance(
      exercise
    );

  if (
    performance.bestEstimated1RM <=
      0 ||
    performance.totalVolume <= 0
  ) {
    return 0;
  }

  const completedSets =
    exercise.sets.filter(
      (set) => set.completed
    ).length;

  const baseGain =
    4 +
    Math.min(
      6,
      completedSets
    );

  const volumeBonus =
    Math.min(
      4,
      performance.totalVolume /
        1000
    );

  return Math.max(
    1,
    Math.round(
      baseGain +
        volumeBonus
    )
  );
}

/**
 * Groups exercise gains by body part.
 */
export function calculateBodyPartChanges(
  exercises: Exercise[]
): Partial<
  Record<MuscleGroup, number>
> {
  const changes: Partial<
    Record<MuscleGroup, number>
  > = {};

  for (const exercise of exercises) {
    const gain =
      calculateExerciseRatingGain(
        exercise
      );

    if (gain <= 0) {
      continue;
    }

    changes[
      exercise.muscleGroup
    ] =
      (changes[
        exercise.muscleGroup
      ] ?? 0) + gain;
  }

  return changes;
}

/**
 * Overall rating gain is based on
 * the workout's body-part performance.
 */
export function calculateOverallGain(
  exercises: Exercise[]
): number {
  const changes =
    calculateBodyPartChanges(
      exercises
    );

  const gains =
    Object.values(changes);

  if (gains.length === 0) {
    return 0;
  }

  const totalGain =
    gains.reduce(
      (total, gain) =>
        total + (gain ?? 0),
      0
    );

  /*
   * Hard cap prevents enormous
   * single-session rating jumps.
   */
  return Math.min(
    30,
    Math.max(
      5,
      Math.round(
        totalGain * 0.55
      )
    )
  );
}

/**
 * Applies a rating change and tells us
 * whether the visible rank changed.
 */
export function applyRatingChange(
  rating: number,
  change: number
): RatingChange {
  const before =
    Math.max(
      STARTING_RATING,
      Math.round(rating)
    );

  const after =
    Math.max(
      STARTING_RATING,
      before +
        Math.round(change)
    );

  const rankBefore =
    getRank(before);

  const rankAfter =
    getRank(after);

  return {
    before,
    after,
    change:
      after - before,
    rankBefore,
    rankAfter,
    rankedUp:
      rankAfter.tier !==
        rankBefore.tier ||
      rankAfter.division !==
        rankBefore.division,
  };
}

/**
 * Creates an empty ranking profile
 * for a new user.
 */
export function createInitialRanking(): RankingState {
  return {
    overallRating:
      STARTING_RATING,

    bodyParts: {},

    lifts: {},

    updatedAt:
      Date.now(),
  };
}

/**
 * Updates the ranking profile from
 * a completed workout.
 */
export function processWorkoutRanking(
  previous: RankingState,
  exercises: Exercise[]
): {
  ranking: RankingState;
  overallChange: RatingChange;
  bodyPartChanges: Partial<
    Record<
      MuscleGroup,
      RatingChange
    >
  >;
  liftChanges: Record<
    string,
    RatingChange
  >;
} {
  const bodyPartGains =
    calculateBodyPartChanges(
      exercises
    );

  const overallGain =
    calculateOverallGain(
      exercises
    );

  const overallChange =
    applyRatingChange(
      previous.overallRating,
      overallGain
    );

  const bodyPartChanges: Partial<
    Record<
      MuscleGroup,
      RatingChange
    >
  > = {};

  const nextBodyParts: Partial<
    Record<
      MuscleGroup,
      BodyPartRating
    >
  > = {
    ...previous.bodyParts,
  };

  for (const [
    muscleGroup,
    gain,
  ] of Object.entries(
    bodyPartGains
  ) as Array<
    [MuscleGroup, number]
  >) {
    const existing =
      previous.bodyParts[
        muscleGroup
      ];

    const before =
      existing?.rating ??
      STARTING_RATING;

    const change =
      applyRatingChange(
        before,
        gain
      );

    bodyPartChanges[
      muscleGroup
    ] = change;

    nextBodyParts[
      muscleGroup
    ] = {
      muscleGroup,
      rating:
        change.after,
      workoutsTracked:
        (existing
          ?.workoutsTracked ??
          0) + 1,
    };
  }

  const nextLifts: Record<
    string,
    LiftRating
  > = {
    ...previous.lifts,
  };

  const liftChanges: Record<
    string,
    RatingChange
  > = {};

  for (const exercise of exercises) {
    const performance =
      calculateExercisePerformance(
        exercise
      );

    if (
      performance.bestEstimated1RM <=
        0 ||
      performance.totalVolume <= 0
    ) {
      continue;
    }

    const key =
      exercise.name
        .trim()
        .toLowerCase();

    const existing =
      previous.lifts[key];

    const gain =
      calculateExerciseRatingGain(
        exercise
      );

    const ratingChange =
      applyRatingChange(
        existing?.rating ??
          STARTING_RATING,
        gain
      );

    liftChanges[key] =
      ratingChange;

    nextLifts[key] = {
      exerciseName:
        exercise.name,

      muscleGroup:
        exercise.muscleGroup,

      rating:
        ratingChange.after,

      bestEstimated1RM:
        Math.max(
          existing
            ?.bestEstimated1RM ??
            0,
          performance.bestEstimated1RM
        ),

      bestWeight:
        Math.max(
          existing?.bestWeight ??
            0,
          performance.bestWeight
        ),

      bestReps:
        performance.bestEstimated1RM >
        (existing
          ?.bestEstimated1RM ??
          0)
          ? performance.bestReps
          : existing?.bestReps ??
            performance.bestReps,

      totalVolume:
        (existing
          ?.totalVolume ??
          0) +
        performance.totalVolume,

      workoutsTracked:
        (existing
          ?.workoutsTracked ??
          0) + 1,
    };
  }

  return {
    ranking: {
      overallRating:
        overallChange.after,

      bodyParts:
        nextBodyParts,

      lifts:
        nextLifts,

      updatedAt:
        Date.now(),
    },

    overallChange,

    bodyPartChanges,

    liftChanges,
  };
}
