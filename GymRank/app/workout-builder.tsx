import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { playSound } from '../services/soundService';

import type {
  RankingState,
  BodyPartRating,
  LiftRating,
} from '../types/ranking';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type MuscleGroup =
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

type SetData = {
  id: string;
  weight: string;
  reps: string;
  completed: boolean;
};

type Exercise = {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  sets: SetData[];
};

type ExerciseDefinition = {
  name: string;
  muscleGroup: MuscleGroup;
};

type WorkoutState = {
  id: string;
  name: string;
  startedAt: number;
  updatedAt: number;
  exercises: Exercise[];
};

const ACTIVE_WORKOUT_KEY = '@gymrank/active-workout';
const COMPLETED_WORKOUTS_KEY = '@gymrank/completed-workouts';

const EXERCISES: ExerciseDefinition[] = [
  { name: 'Bench Press', muscleGroup: 'Chest' },
  { name: 'Incline Bench Press', muscleGroup: 'Chest' },
  { name: 'Dumbbell Bench Press', muscleGroup: 'Chest' },
  { name: 'Incline Dumbbell Press', muscleGroup: 'Chest' },
  { name: 'Cable Fly', muscleGroup: 'Chest' },
  { name: 'Chest Press', muscleGroup: 'Chest' },

  { name: 'Pull Ups', muscleGroup: 'Back' },
  { name: 'Lat Pulldown', muscleGroup: 'Back' },
  { name: 'Barbell Row', muscleGroup: 'Back' },
  { name: 'Seated Cable Row', muscleGroup: 'Back' },
  { name: 'Chest Supported Row', muscleGroup: 'Back' },
  { name: 'Single Arm Dumbbell Row', muscleGroup: 'Back' },

  { name: 'Shoulder Press', muscleGroup: 'Shoulders' },
  { name: 'Dumbbell Shoulder Press', muscleGroup: 'Shoulders' },
  { name: 'Lateral Raise', muscleGroup: 'Shoulders' },
  { name: 'Cable Lateral Raise', muscleGroup: 'Shoulders' },
  { name: 'Rear Delt Fly', muscleGroup: 'Shoulders' },

  { name: 'Barbell Curl', muscleGroup: 'Biceps' },
  { name: 'Dumbbell Curl', muscleGroup: 'Biceps' },
  { name: 'Hammer Curl', muscleGroup: 'Biceps' },
  { name: 'Preacher Curl', muscleGroup: 'Biceps' },
  { name: 'Cable Curl', muscleGroup: 'Biceps' },

  { name: 'Tricep Pushdown', muscleGroup: 'Triceps' },
  { name: 'Overhead Tricep Extension', muscleGroup: 'Triceps' },
  { name: 'Skull Crushers', muscleGroup: 'Triceps' },
  { name: 'Close Grip Bench Press', muscleGroup: 'Triceps' },

  { name: 'Barbell Squat', muscleGroup: 'Quads' },
  { name: 'Leg Press', muscleGroup: 'Quads' },
  { name: 'Hack Squat', muscleGroup: 'Quads' },
  { name: 'Leg Extension', muscleGroup: 'Quads' },

  { name: 'Romanian Deadlift', muscleGroup: 'Hamstrings' },
  { name: 'Lying Leg Curl', muscleGroup: 'Hamstrings' },
  { name: 'Seated Leg Curl', muscleGroup: 'Hamstrings' },

  { name: 'Hip Thrust', muscleGroup: 'Glutes' },
  { name: 'Bulgarian Split Squat', muscleGroup: 'Glutes' },
  { name: 'Cable Kickback', muscleGroup: 'Glutes' },

  { name: 'Standing Calf Raise', muscleGroup: 'Calves' },
  { name: 'Seated Calf Raise', muscleGroup: 'Calves' },

  { name: 'Cable Crunch', muscleGroup: 'Core' },
  { name: 'Hanging Leg Raise', muscleGroup: 'Core' },
  { name: 'Ab Wheel', muscleGroup: 'Core' },
];

const MUSCLE_GROUPS: Array<'All' | MuscleGroup> = [
  'All',
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Core',
];

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createEmptySet(): SetData {
  return {
    id: createId(),
    weight: '',
    reps: '',
    completed: false,
  };
}

function createWorkout(): WorkoutState {
  const now = Date.now();

  return {
    id: createId(),
    name: 'Workout',
    startedAt: now,
    updatedAt: now,
    exercises: [],
  };
}

function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.max(
    0,
    Math.floor(milliseconds / 1000)
  );

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(
      minutes
    ).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(
    seconds
  ).padStart(2, '0')}`;
}

export default function WorkoutBuilder() {
  const [workout, setWorkout] = useState<WorkoutState | null>(
    null
  );
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(true);

  const [showExercisePicker, setShowExercisePicker] =
    useState(false);
  const [showWorkoutMenu, setShowWorkoutMenu] = useState(false);

  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] =
    useState<'All' | MuscleGroup>('All');
  const [selectedExercises, setSelectedExercises] = useState<
    string[]
  >([]);

  const saveTimeout =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  /*
   * Load an existing active workout.
   *
   * This means the workout survives the app being backgrounded
   * or terminated.
   */
  useEffect(() => {
    let mounted = true;

    async function loadWorkout() {
      try {
        const stored = await AsyncStorage.getItem(
          ACTIVE_WORKOUT_KEY
        );

        if (!mounted) {
          return;
        }

        if (stored) {
          const parsed: WorkoutState = JSON.parse(stored);

          setWorkout(parsed);
          setElapsed(Date.now() - parsed.startedAt);
        } else {
          const freshWorkout = createWorkout();

          setWorkout(freshWorkout);
          setElapsed(0);

          await AsyncStorage.setItem(
            ACTIVE_WORKOUT_KEY,
            JSON.stringify(freshWorkout)
          );
        }
      } catch (error) {
        console.error(
          'Failed to load active workout:',
          error
        );

        const freshWorkout = createWorkout();

        if (mounted) {
          setWorkout(freshWorkout);
          setElapsed(0);
        }

        try {
          await AsyncStorage.setItem(
            ACTIVE_WORKOUT_KEY,
            JSON.stringify(freshWorkout)
          );
        } catch (storageError) {
          console.error(
            'Failed to create fallback workout:',
            storageError
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadWorkout();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * Timer uses startedAt rather than incrementing a counter.
   *
   * This keeps the timer accurate when Android suspends
   * the JavaScript thread.
   */
  useEffect(() => {
    if (!workout) {
      return;
    }

    const updateTimer = () => {
      setElapsed(Date.now() - workout.startedAt);
    };

    updateTimer();

    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [workout?.startedAt]);

  /*
   * Persist workout changes with a small debounce.
   */
  const persistWorkout = useCallback(
    (nextWorkout: WorkoutState) => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }

      saveTimeout.current = setTimeout(async () => {
        try {
          await AsyncStorage.setItem(
            ACTIVE_WORKOUT_KEY,
            JSON.stringify(nextWorkout)
          );
        } catch (error) {
          console.error(
            'Failed to save workout:',
            error
          );
        }
      }, 250);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, []);

  const updateWorkout = useCallback(
    (
      updater: (current: WorkoutState) => WorkoutState
    ) => {
      setWorkout((current) => {
        if (!current) {
          return current;
        }

        const next = updater(current);

        const updated: WorkoutState = {
          ...next,
          updatedAt: Date.now(),
        };

        persistWorkout(updated);

        return updated;
      });
    },
    [persistWorkout]
  );

  const filteredExercises = useMemo(() => {
    return EXERCISES.filter((exercise) => {
      const matchesMuscle =
        selectedMuscle === 'All' ||
        exercise.muscleGroup === selectedMuscle;

      const matchesSearch = exercise.name
        .toLowerCase()
        .includes(search.toLowerCase());

      return matchesMuscle && matchesSearch;
    }).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [search, selectedMuscle]);

  function openExercisePicker() {
    setSearch('');
    setSelectedMuscle('All');
    setSelectedExercises([]);
    setShowExercisePicker(true);
  }

  function toggleExercise(name: string) {
    setSelectedExercises((current) =>
      current.includes(name)
        ? current.filter(
            (exercise) => exercise !== name
          )
        : [...current, name]
    );
  }

  function addSelectedExercises() {
    if (
      !workout ||
      selectedExercises.length === 0
    ) {
      return;
    }

    const newExercises: Exercise[] = selectedExercises
      .map((name) =>
        EXERCISES.find(
          (exercise) => exercise.name === name
        )
      )
      .filter(
        (
          exercise
        ): exercise is ExerciseDefinition =>
          Boolean(exercise)
      )
      .map((exercise) => ({
        id: createId(),
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        sets: [createEmptySet()],
      }));

    updateWorkout((current) => ({
      ...current,
      exercises: [
        ...current.exercises,
        ...newExercises,
      ],
    }));

    setSelectedExercises([]);
    setShowExercisePicker(false);
  }

  function updateSet(
    exerciseId: string,
    setId: string,
    field: 'weight' | 'reps',
    value: string
  ) {
    updateWorkout((current) => ({
      ...current,
      exercises: current.exercises.map(
        (exercise) => {
          if (exercise.id !== exerciseId) {
            return exercise;
          }

          return {
            ...exercise,
            sets: exercise.sets.map((set) =>
              set.id === setId
                ? {
                    ...set,
                    [field]: value,
                    completed: false,
                  }
                : set
            ),
          };
        }
      ),
    }));
  }

  function addSet(exerciseId: string) {
    updateWorkout((current) => ({
      ...current,
      exercises: current.exercises.map(
        (exercise) =>
          exercise.id === exerciseId
            ? {
                ...exercise,
                sets: [
                  ...exercise.sets,
                  createEmptySet(),
                ],
              }
            : exercise
      ),
    }));
  }

  async function toggleSetComplete(
    exerciseId: string,
    setId: string
  ) {
    if (!workout) {
      return;
    }

    const exercise = workout.exercises.find(
      (item) => item.id === exerciseId
    );

    const set = exercise?.sets.find(
      (item) => item.id === setId
    );

    if (!set) {
      return;
    }

    /*
     * Don't allow an empty set to be completed.
     */
    if (
      !set.completed &&
      (!set.weight.trim() || !set.reps.trim())
    ) {
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning
      );

      Alert.alert(
        'Incomplete set',
        'Enter both weight and reps before completing this set.'
      );

      return;
    }

    const completing = !set.completed;

    updateWorkout((current) => ({
      ...current,
      exercises: current.exercises.map(
        (exerciseItem) =>
          exerciseItem.id === exerciseId
            ? {
                ...exerciseItem,
                sets: exerciseItem.sets.map(
                  (setItem) =>
                    setItem.id === setId
                      ? {
                          ...setItem,
                          completed: completing,
                        }
                      : setItem
                ),
              }
            : exerciseItem
      ),
    }));

    if (completing) {
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );
    }
  }

  function removeExercise(exerciseId: string) {
    Alert.alert(
      'Remove exercise?',
      'This will remove the exercise and its sets from this workout.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            updateWorkout((current) => ({
              ...current,
              exercises:
                current.exercises.filter(
                  (exercise) =>
                    exercise.id !== exerciseId
                ),
            }));
          },
        },
      ]
    );
  }

  function updateWorkoutName(name: string) {
    updateWorkout((current) => ({
      ...current,
      name,
    }));
  }

  async function finishWorkout() {
    if (!workout) {
      return;
    }

    const completedSets = workout.exercises.reduce(
      (total, exercise) =>
        total +
        exercise.sets.filter(
          (set) => set.completed
        ).length,
      0
    );

    if (completedSets === 0) {
      Alert.alert(
        'Finish workout?',
        'No sets have been completed yet. Are you sure you want to finish?',
        [
          {
            text: 'Keep Training',
            style: 'cancel',
          },
          {
            text: 'Finish',
            style: 'destructive',
            onPress: () => completeWorkout(),
          },
        ]
      );

      return;
    }

    await completeWorkout();
  }

  async function completeWorkout() {
    if (!workout) {
      return;
    }

    try {
      const existing =
        await AsyncStorage.getItem(
          COMPLETED_WORKOUTS_KEY
        );

      const completedWorkouts: WorkoutState[] =
        existing ? JSON.parse(existing) : [];

      const completedWorkout: WorkoutState = {
        ...workout,
        updatedAt: Date.now(),
      };

      await AsyncStorage.setItem(
        COMPLETED_WORKOUTS_KEY,
        JSON.stringify([
          completedWorkout,
          ...completedWorkouts,
        ])
      );

      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
        saveTimeout.current = null;
      }

      await AsyncStorage.removeItem(
        ACTIVE_WORKOUT_KEY
      );

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );

      router.back();
    } catch (error) {
      console.error(
        'Failed to finish workout:',
        error
      );

      Alert.alert(
        "Couldn't finish workout",
        'Your workout could not be saved. Please try again.'
      );
    }
  }

  function discardWorkout() {
    Alert.alert(
      'Discard workout?',
      'Everything logged in this workout will be permanently removed.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            try {
              if (saveTimeout.current) {
                clearTimeout(saveTimeout.current);
                saveTimeout.current = null;
              }

              await AsyncStorage.removeItem(
                ACTIVE_WORKOUT_KEY
              );

              router.back();
            } catch (error) {
              console.error(
                'Failed to discard workout:',
                error
              );
            }
          },
        },
      ]
    );
  }

  if (loading || !workout) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          Loading workout...
        </Text>
      </View>
    );
  }

  if (showExercisePicker) {
    return (
      <View style={styles.container}>
        <View style={styles.pickerHeader}>
          <Pressable
            hitSlop={10}
            onPress={() =>
              setShowExercisePicker(false)
            }
          >
            <Text style={styles.back}>
              ‹ Back
            </Text>
          </Pressable>

          <Text style={styles.headerTitle}>
            Add Exercises
          </Text>

          <View style={styles.selectedCount}>
            <Text
              style={styles.selectedCountText}
            >
              {selectedExercises.length}
            </Text>
          </View>
        </View>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search exercises..."
          placeholderTextColor="#77777F"
          style={styles.searchInput}
          autoCorrect={false}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filters}
          contentContainerStyle={
            styles.filterContent
          }
        >
          {MUSCLE_GROUPS.map((group) => {
            const active =
              selectedMuscle === group;

            return (
              <Pressable
                key={group}
                onPress={() =>
                  setSelectedMuscle(group)
                }
                style={[
                  styles.filterButton,
                  active &&
                    styles.filterButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    active &&
                      styles.filterTextActive,
                  ]}
                >
                  {group}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView
          style={styles.exerciseList}
          contentContainerStyle={
            styles.exerciseListContent
          }
          keyboardShouldPersistTaps="handled"
        >
          {filteredExercises.map(
            (exercise) => {
              const selected =
                selectedExercises.includes(
                  exercise.name
                );

              return (
                <Pressable
                  key={exercise.name}
                  style={styles.exerciseOption}
                  onPress={() =>
                    toggleExercise(
                      exercise.name
                    )
                  }
                >
                  <View
                    style={
                      styles.exerciseOptionText
                    }
                  >
                    <Text
                      style={
                        styles.exerciseOptionName
                      }
                    >
                      {exercise.name}
                    </Text>

                    <Text
                      style={
                        styles.exerciseOptionMuscle
                      }
                    >
                      {exercise.muscleGroup}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.checkbox,
                      selected &&
                        styles.checkboxSelected,
                    ]}
                  >
                    {selected && (
                      <Text
                        style={styles.checkmark}
                      >
                        ✓
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            }
          )}
        </ScrollView>

        <Pressable
          style={[
            styles.addSelectedButton,
            selectedExercises.length === 0 &&
              styles.addSelectedButtonDisabled,
          ]}
          disabled={
            selectedExercises.length === 0
          }
          onPress={addSelectedExercises}
        >
          <Text
            style={styles.addSelectedText}
          >
            Add {selectedExercises.length}{' '}
            {selectedExercises.length === 1
              ? 'Exercise'
              : 'Exercises'}
          </Text>
        </Pressable>
      </View>
    );
  }

  const completedSets = workout.exercises.reduce(
    (total, exercise) =>
      total +
      exercise.sets.filter(
        (set) => set.completed
      ).length,
    0
  );

  const totalSets = workout.exercises.reduce(
    (total, exercise) =>
      total + exercise.sets.length,
    0
  );

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Pressable
              hitSlop={10}
              onPress={() => router.back()}
            >
              <Text style={styles.back}>
                ‹ Back
              </Text>
            </Pressable>

            <Text style={styles.headerTitle}>
              Workout
            </Text>

            <Pressable
              style={styles.timerButton}
              onPress={() =>
                setShowWorkoutMenu(true)
              }
              hitSlop={8}
            >
              <Text style={styles.timer}>
                {formatDuration(elapsed)}
              </Text>

              <Text
                style={styles.timerChevron}
              >
                ⌄
              </Text>
            </Pressable>
          </View>

          <TextInput
            value={workout.name}
            onChangeText={updateWorkoutName}
            placeholder="Workout name"
            placeholderTextColor="#66666D"
            style={styles.workoutName}
            selectTextOnFocus
          />

          {workout.exercises.length === 0 && (
            <View style={styles.emptyState}>
              <View
                style={styles.emptyIconCircle}
              >
                <Text style={styles.emptyIcon}>
                  +
                </Text>
              </View>

              <Text style={styles.emptyTitle}>
                Your workout has started
              </Text>

              <Text style={styles.emptyText}>
                Add exercises below and log
                every set as you train. Your
                progress is saved automatically.
              </Text>
            </View>
          )}

          {workout.exercises.map(
            (exercise) => (
              <View
                key={exercise.id}
                style={styles.exerciseCard}
              >
                <View
                  style={styles.exerciseHeader}
                >
                  <View
                    style={
                      styles.exerciseHeaderText
                    }
                  >
                    <Text
                      style={styles.exerciseName}
                    >
                      {exercise.name}
                    </Text>

                    <Text
                      style={styles.muscleLabel}
                    >
                      {exercise.muscleGroup}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() =>
                      removeExercise(
                        exercise.id
                      )
                    }
                    hitSlop={10}
                  >
                    <Text
                      style={styles.remove}
                    >
                      Remove
                    </Text>
                  </Pressable>
                </View>

                <View
                  style={styles.tableHeader}
                >
                  <Text
                    style={styles.setHeader}
                  >
                    SET
                  </Text>

                  <Text
                    style={styles.inputHeader}
                  >
                    KG
                  </Text>

                  <Text
                    style={styles.inputHeader}
                  >
                    REPS
                  </Text>

                  <View
                    style={styles.tickSpace}
                  />
                </View>

                {exercise.sets.map(
                  (set, index) => (
                    <View
                      key={set.id}
                      style={[
                        styles.setRow,
                        set.completed &&
                          styles.completedSetRow,
                      ]}
                    >
                      <Text
                        style={styles.setNumber}
                      >
                        {index + 1}
                      </Text>

                      <TextInput
                        value={set.weight}
                        onChangeText={(
                          value
                        ) =>
                          updateSet(
                            exercise.id,
                            set.id,
                            'weight',
                            value
                          )
                        }
                        placeholder="0"
                        placeholderTextColor="#55555C"
                        keyboardType="decimal-pad"
                        style={[
                          styles.setInput,
                          set.completed &&
                            styles.completedInput,
                        ]}
                      />

                      <TextInput
                        value={set.reps}
                        onChangeText={(
                          value
                        ) =>
                          updateSet(
                            exercise.id,
                            set.id,
                            'reps',
                            value
                          )
                        }
                        placeholder="0"
                        placeholderTextColor="#55555C"
                        keyboardType="number-pad"
                        style={[
                          styles.setInput,
                          set.completed &&
                            styles.completedInput,
                        ]}
                      />

                      <Pressable
                        style={[
                          styles.completeButton,
                          set.completed &&
                            styles.completeButtonActive,
                        ]}
                        onPress={() =>
                          toggleSetComplete(
                            exercise.id,
                            set.id
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.completeIcon,
                            set.completed &&
                              styles.completeIconActive,
                          ]}
                        >
                          ✓
                        </Text>
                      </Pressable>
                    </View>
                  )
                )}

                <Pressable
                  style={styles.addSetButton}
                  onPress={() =>
                    addSet(exercise.id)
                  }
                >
                  <Text
                    style={styles.addSetText}
                  >
                    + Add Set
                  </Text>
                </Pressable>
              </View>
            )
          )}

          <Pressable
            style={styles.addExerciseButton}
            onPress={openExercisePicker}
          >
            <Text
              style={styles.addExerciseText}
            >
              + Add Exercise
            </Text>
          </Pressable>

          {workout.exercises.length > 0 && (
            <View
              style={styles.workoutSummary}
            >
              <Text
                style={styles.summaryText}
              >
                {workout.exercises.length}{' '}
                {workout.exercises.length === 1
                  ? 'exercise'
                  : 'exercises'}{' '}
                · {completedSets}/{totalSets}{' '}
                sets completed
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showWorkoutMenu}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowWorkoutMenu(false)
        }
      >
        <Pressable
          style={styles.menuOverlay}
          onPress={() =>
            setShowWorkoutMenu(false)
          }
        >
          <Pressable
            style={styles.workoutMenu}
            onPress={(event) =>
              event.stopPropagation()
            }
          >
            <View
              style={styles.menuHandle}
            />

            <Text style={styles.menuTitle}>
              Workout
            </Text>

            <Text style={styles.menuTimer}>
              {formatDuration(elapsed)}
            </Text>

            <View
              style={styles.menuDivider}
            />

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setShowWorkoutMenu(false);
                finishWorkout();
              }}
            >
              <View>
                <Text
                  style={styles.menuItemTitle}
                >
                  Finish Workout
                </Text>

                <Text
                  style={styles.menuItemSubtitle}
                >
                  Save this session to your
                  history
                </Text>
              </View>

              <Text
                style={styles.menuArrow}
              >
                ›
              </Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setShowWorkoutMenu(false);
                discardWorkout();
              }}
            >
              <View>
                <Text
                  style={[
                    styles.menuItemTitle,
                    styles.destructiveText,
                  ]}
                >
                  Discard Workout
                </Text>

                <Text
                  style={styles.menuItemSubtitle}
                >
                  Delete this session
                </Text>
              </View>

              <Text
                style={styles.menuArrow}
              >
                ›
              </Text>
            </Pressable>

            <Pressable
              style={styles.menuCancel}
              onPress={() =>
                setShowWorkoutMenu(false)
              }
            >
              <Text
                style={styles.menuCancelText}
              >
                Cancel
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0D',
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#0B0B0D',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: '#77777F',
    fontSize: 15,
  },

  content: {
    padding: 20,
    paddingTop: 58,
    paddingBottom: 45,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 58,
    paddingBottom: 18,
  },

  back: {
    color: '#A6A6AD',
    fontSize: 17,
    width: 55,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },

  timerButton: {
    minWidth: 82,
    height: 36,
    paddingHorizontal: 9,
    borderRadius: 10,
    backgroundColor: '#17171B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },

  timer: {
    color: '#FFFFFF',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
  },

  timerChevron: {
    color: '#77777F',
    fontSize: 16,
    marginTop: -3,
  },

  workoutName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 24,
  },

  emptyState: {
    backgroundColor: '#151519',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    marginBottom: 16,
  },

  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#232329',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  emptyIcon: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
  },

  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 7,
  },

  emptyText: {
    color: '#77777F',
    textAlign: 'center',
    lineHeight: 20,
  },

  exerciseCard: {
    backgroundColor: '#151519',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },

  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  exerciseHeaderText: {
    flex: 1,
    paddingRight: 12,
  },

  exerciseName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  muscleLabel: {
    color: '#77777F',
    fontSize: 12,
    marginTop: 3,
  },

  remove: {
    color: '#E05A5A',
    fontSize: 13,
  },

  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },

  setHeader: {
    color: '#66666D',
    fontSize: 11,
    fontWeight: '700',
    width: 38,
  },

  inputHeader: {
    color: '#66666D',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },

  tickSpace: {
    width: 44,
  },

  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 10,
  },

  completedSetRow: {
    opacity: 0.9,
  },

  setNumber: {
    color: '#A6A6AD',
    width: 38,
    fontSize: 14,
  },

  setInput: {
    backgroundColor: '#202025',
    borderRadius: 9,
    color: '#FFFFFF',
    height: 44,
    flex: 1,
    marginHorizontal: 4,
    textAlign: 'center',
    fontSize: 15,
  },

  completedInput: {
    backgroundColor: '#18251C',
  },

  completeButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#202025',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },

  completeButtonActive: {
    backgroundColor: '#35C759',
  },

  completeIcon: {
    color: '#66666D',
    fontSize: 20,
    fontWeight: '800',
  },

  completeIconActive: {
    color: '#FFFFFF',
  },

  addSetButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },

  addSetText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  addExerciseButton: {
    borderWidth: 1,
    borderColor: '#333339',
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 2,
  },

  addExerciseText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  workoutSummary: {
    alignItems: 'center',
    paddingVertical: 20,
  },

  summaryText: {
    color: '#66666D',
    fontSize: 13,
  },

  searchInput: {
    backgroundColor: '#17171B',
    color: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },

  filters: {
    flexGrow: 0,
    marginTop: 14,
  },

  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 12,
  },

  filterButton: {
    backgroundColor: '#19191D',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  filterButtonActive: {
    backgroundColor: '#FFFFFF',
  },

  filterText: {
    color: '#88888F',
    fontSize: 13,
    fontWeight: '600',
  },

  filterTextActive: {
    color: '#0B0B0D',
  },

  exerciseList: {
    flex: 1,
  },

  exerciseListContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },

  exerciseOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#202025',
  },

  exerciseOptionText: {
    flex: 1,
    paddingRight: 15,
  },

  exerciseOptionName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  exerciseOptionMuscle: {
    color: '#66666D',
    fontSize: 12,
    marginTop: 3,
  },

  checkbox: {
    width: 25,
    height: 25,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#44444A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxSelected: {
    backgroundColor: '#35C759',
    borderColor: '#35C759',
  },

  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  addSelectedButton: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
  },

  addSelectedButtonDisabled: {
    opacity: 0.35,
  },

  addSelectedText: {
    color: '#0B0B0D',
    fontSize: 16,
    fontWeight: '800',
  },

  selectedCount: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#303036',
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectedCountText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    justifyContent: 'flex-end',
  },

  workoutMenu: {
    backgroundColor: '#18181C',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },

  menuHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#44444A',
    alignSelf: 'center',
    marginBottom: 20,
  },

  menuTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },

  menuTimer: {
    color: '#77777F',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
    fontVariant: ['tabular-nums'],
  },

  menuDivider: {
    height: 1,
    backgroundColor: '#29292E',
    marginVertical: 18,
  },

  menuItem: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#29292E',
  },

  menuItemTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  menuItemSubtitle: {
    color: '#6F6F77',
    fontSize: 12,
    marginTop: 4,
  },

  menuArrow: {
    color: '#77777F',
    fontSize: 27,
    fontWeight: '300',
  },

  destructiveText: {
    color: '#FF5C5C',
  },

  menuCancel: {
    marginTop: 18,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#29292E',
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuCancelText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
