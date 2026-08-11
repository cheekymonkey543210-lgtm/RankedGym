import { useAudioPlayer } from 'expo-audio';
import { useCallback } from 'react';

import setCompleteSound from '../assets/sounds/set-complete.mp3';
import workoutCompleteSound from '../assets/sounds/workout-complete.mp3';
import rankUpSound from '../assets/sounds/rank-up.mp3';

export type SoundEffect =
  | 'set_complete'
  | 'workout_complete'
  | 'rank_up';

const SOUND_SOURCES = {
  set_complete: setCompleteSound,
  workout_complete: workoutCompleteSound,
  rank_up: rankUpSound,
} as const;

export function useSoundEffects() {
  const setCompletePlayer = useAudioPlayer(
    SOUND_SOURCES.set_complete
  );
  const workoutCompletePlayer = useAudioPlayer(
    SOUND_SOURCES.workout_complete
  );
  const rankUpPlayer = useAudioPlayer(
    SOUND_SOURCES.rank_up
  );

  const playSound = useCallback(
    (effect: SoundEffect) => {
      const player =
        effect === 'set_complete'
          ? setCompletePlayer
          : effect === 'workout_complete'
            ? workoutCompletePlayer
            : rankUpPlayer;

      if (player?.isLoaded) {
        player.seekTo(0);
        player.play();
      }
    },
    [setCompletePlayer, workoutCompletePlayer, rankUpPlayer]
  );

  return { playSound };
}
