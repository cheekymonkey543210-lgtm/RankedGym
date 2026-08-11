import { createAudioPlayer } from 'expo-audio';

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

/**
 * Plays a short UI sound.
 *
 * Audio is intentionally treated as an enhancement.
 * If playback fails, workout functionality continues.
 */
export function playSound(effect: SoundEffect) {
  try {
    const player = createAudioPlayer(
      SOUND_SOURCES[effect]
    );

    player.volume =
      effect === 'set_complete'
        ? 0.65
        : 0.8;

    player.play();

    setTimeout(() => {
      try {
        player.remove();
      } catch {
        // Audio cleanup must never interrupt workout logging.
      }
    }, 2000);
  } catch (error) {
    console.warn(
      `Failed to play ${effect} sound:`,
      error
    );
  }
}

